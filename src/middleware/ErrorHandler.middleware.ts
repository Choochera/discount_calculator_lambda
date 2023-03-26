import { Request, Response, NextFunction } from "express";
import HttpException from '@/utils/exceptions/HttpException';

function errorMiddleware(
    error: HttpException,
    req: Request,
    response: Response,
    next: NextFunction
): void {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';

    response.status(status).send({
        status,
        message
    });
}

export default errorMiddleware;