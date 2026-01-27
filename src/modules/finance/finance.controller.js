import Finance from './finance.model.js';
import Project from '../project/project.model.js';
import Client from '../client/client.model.js';
import Employee from '../employee/employee.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../utils/logger.js';
import STATUS from '../../constants/status.js';
import TRANSACTION_TYPE from '../../constants/transactionType.js';

/**
 * createTransaction - Validations and clean entry
 */
const createTransaction = asyncHandler(async (req, res) => {
  const {
    transactionType, amount, description, project: projectId,
    client: clientId, employee: employeeId, transactionDate, remarks
  } = req.body;

  // 1. Basic Validations
  if (!transactionType) throw new ApiError(400, 'transactionType is required');
  const allowedTypes = TRANSACTION_TYPE ? Object.values(TRANSACTION_TYPE) : ['income', 'expense'];
  if (!allowedTypes.includes(transactionType)) throw new ApiError(400, 'invalid transactionType');

  if (typeof amount !== 'number' || amount <= 0) {
    throw new ApiError(400, 'Valid positive amount is required');
  }

  // 2. Parallel ID Validations (Performance optimization)
  const validationPromises = [];
  if (projectId) validationPromises.push(Project.exists({ _id: projectId }));
  if (clientId) validationPromises.push(Client.exists({ _id: clientId }));
  if (employeeId) validationPromises.push(Employee.exists({ _id: employeeId }));

  const validationResults = await Promise.all(validationPromises);
  if (validationResults.some(result => !result)) {
    throw new ApiError(404, 'One or more linked entities (Project/Client/Employee) not found');
  }

  const transaction = await Finance.create({
    transactionType,
    amount,
    description,
    project: projectId,
    client: clientId,
    employee: employeeId,
    transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    createdBy: req.user?._id,
    remarks
  });

  logger.info('Finance transaction created', { id: transaction._id, by: req.user?._id });
  return res.status(201).json(new ApiResponse(201, transaction, 'Transaction created successfully'));
});

/**
 * getTransactions - Includes Summary (Total Income, Expense, Balance)
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, from, to, project: projectId, client: clientId, employee: employeeId } = req.query;

  const filter = { status: STATUS.ACTIVE };
  if (type) filter.transactionType = type;
  if (projectId) filter.project = projectId;
  if (clientId) filter.client = clientId;
  if (employeeId) filter.employee = employeeId;
  if (from || to) {
    filter.transactionDate = {};
    if (from) filter.transactionDate.$gte = new Date(from);
    if (to) filter.transactionDate.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);

  // 🔥 Powerful Aggregation for Summary & Data in one go
  const [data] = await Finance.aggregate([
    { $match: filter },
    {
      $facet: {
        // Part 1: Summary Calculation
        summary: [
          {
            $group: {
              _id: null,
              totalIncome: {
                $sum: { $cond: [{ $eq: ["$transactionType", "income"] }, "$amount", 0] }
              },
              totalExpense: {
                $sum: { $cond: [{ $eq: ["$transactionType", "expense"] }, "$amount", 0] }
              }
            }
          },
          {
            $project: {
              _id: 0,
              totalIncome: 1,
              totalExpense: 1,
              netBalance: { $subtract: ["$totalIncome", "$totalExpense"] }
            }
          }
        ],
        // Part 2: Paginated Data
        items: [
          { $sort: { transactionDate: -1 } },
          { $skip: skip },
          { $limit: Number(limit) }
        ],
        // Part 3: Total Count
        totalCount: [{ $count: "count" }]
      }
    }
  ]);

  // Transform data for population (Manually populate because aggregation doesn't auto-populate)
  const items = await Finance.populate(data.items, [
    { path: 'project', select: 'name' },
    { path: 'client', select: 'name companyName' },
    { path: 'employee', select: 'employeeId name designation' }
  ]);

  const summary = data.summary[0] || { totalIncome: 0, totalExpense: 0, netBalance: 0 };
  const total = data.totalCount[0]?.count || 0;

  return res.json(new ApiResponse(200, {
    items,
    summary,
    meta: { total, page: Number(page), limit: Number(limit) }
  }, 'Transactions fetched'));
});

/**
 * updateTransaction
 */
const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, description, status, remarks } = req.body;

  const transaction = await Finance.findById(id);
  if (!transaction) throw new ApiError(404, 'Transaction not found');

  if (typeof amount === 'number') {
    if (amount < 0) throw new ApiError(400, "Amount cannot be negative");
    transaction.amount = amount;
  }

  if (description) transaction.description = description;
  if (remarks) transaction.remarks = remarks;
  if (status && Object.values(STATUS).includes(status)) transaction.status = status;

  await transaction.save();

  logger.info('Transaction updated', { id: transaction._id, by: req.user._id });
  return res.json(new ApiResponse(200, transaction, 'Transaction updated successfully'));
});

// Baki functions (getById, delete) aapke purane wale hi perfect hain.
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Finance.findById(req.params.id)
    .populate('project', 'name')
    .populate('client', 'name companyName')
    .populate('employee', 'employeeId designation');
  if (!transaction) throw new ApiError(404, 'Transaction not found');
  return res.json(new ApiResponse(200, transaction, 'Transaction fetched'));
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Finance.findByIdAndUpdate(req.params.id, { status: STATUS.INACTIVE }, { new: true });
  if (!transaction) throw new ApiError(404, 'Transaction not found');
  return res.json(new ApiResponse(200, null, 'Transaction deleted'));
});

export default { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction };