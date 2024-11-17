import { StatusCodes } from 'http-status-codes';

class ClientError extends Error {
    constructor(error) {
        super();
        this.name = 'ClientError';
        this.message = error.message;
        this.explanation = error.explanation;
        this.statusCodes = error.statusCodes
            ? error.statusCodes
            : StatusCodes.BAD_REQUEST;
    }
}

export default ClientError;
