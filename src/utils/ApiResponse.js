class ApiResponse {
  constructor(arg1, arg2, arg3) {
    // ✅ NEW STYLE (object)
    if (typeof arg1 === 'object' && arg1 !== null && !arg1.statusCode) {
      const {
        success = true,
        message = 'Success',
        data = {},
        meta = null
      } = arg1;

      this.success = success;
      this.message = message;
      this.data = data ?? {};
      if (meta) this.meta = meta;
      return;
    }

    // ✅ OLD STYLE (statusCode, data, message)
    const statusCode = arg1;
    const data = arg2;
    const message = arg3 || 'Success';

    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data ?? {};
  }

  /**
   * ✅ STATIC SUCCESS METHOD
   * Yeh wo hissa hai jo missing tha! 
   * Is se "ApiResponse.success(res, data, message)" chal parega.
   */
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? {}
    });
  }
}

export default ApiResponse;