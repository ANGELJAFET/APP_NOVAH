export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface MysqlSignalError {
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

const SIGNAL_ERROR_MAP: Record<string, { statusCode: number; code: string; message: string }> = {
  NIT_ALREADY_EXISTS: {
    statusCode: 409,
    code: "NIT_ALREADY_EXISTS",
    message: "Ya existe una persona registrada con ese NIT.",
  },
  PERSON_NOT_FOUND: {
    statusCode: 404,
    code: "PERSON_NOT_FOUND",
    message: "La persona no existe.",
  },
  INVALID_CREDENTIAL_TYPE: {
    statusCode: 400,
    code: "INVALID_CREDENTIAL_TYPE",
    message: "El tipo de credencial no es válido.",
  },
};

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const mysqlError = error as MysqlSignalError;
  if (mysqlError?.errno === 1644 && mysqlError.sqlMessage) {
    const mapped = SIGNAL_ERROR_MAP[mysqlError.sqlMessage];
    if (mapped) {
      return new AppError(mapped.statusCode, mapped.code, mapped.message);
    }
    return new AppError(400, "DATABASE_VALIDATION_ERROR", "Los datos ingresados no son válidos.");
  }

  return new AppError(500, "INTERNAL_ERROR", "Ocurrió un error inesperado.");
}
