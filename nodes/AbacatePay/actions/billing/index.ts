import { billingResource, billingOperations } from './billing.resource';
import * as create from './create.operation';
import * as list from './list.operation';

export { billingResource, billingOperations };

export const billingOperationExecute = {
	create,
	list,
};
