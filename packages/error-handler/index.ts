export class AppError extends Error{
    public readonly statusCode:number;
    public readonly isOperational:boolean;
    public readonly details?:any;

    constructor(message:string,statusCode:number,isOperational=true,details?:any){
        super(message);
        this.statusCode=statusCode;
        this.isOperational=isOperational;
        this.details=details;
        Error.captureStackTrace(this);
    }
}

//#region Not found Error
export class NotFoundError extends AppError{
    constructor(message="Resource not found"){
        super(message,404);
    }
}
//#endregion

//#region Validation Error
export class ValidationError extends AppError{
    constructor(message="Invalid request data",details?:any){
        super(message,400,true,details)
    }
}
//#endregion

//#region Authentication Error
export class AuthenticationError extends AppError{
    constructor(message="Unautherize"){
        super(message,401);
    }
}
//#endregion

//#region Forbidden Error
export class ForbiddenError extends AppError{
    constructor(message="Access Forbiden"){
        super(message,403);
    }
}
//#endregion

//#region DatabaseError
export class DatabaseError extends AppError{
    constructor(message="Database Error",details?:any){
        super(message,500,true,details)
    }
}
//#endregion

//#region RateLimitError
export class RateLimitError extends AppError{
    constructor(message="Too many request,Please try again later!"){
        super(message,429)
    }
}
//#endregion