import { customerResource, customerOperations } from './customer.resource';
import * as create from './create.operation';
import * as list from './list.operation';

export { customerResource, customerOperations };

export const customerOperationExecute = {
	create,
	list,
};
