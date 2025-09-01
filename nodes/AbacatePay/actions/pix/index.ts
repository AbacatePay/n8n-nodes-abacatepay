import { pixResource, pixOperations } from './pix.resource';
import * as create from './create.operation';
import * as simulatePayment from './simulatePayment.operation';
import * as checkStatus from './checkStatus.operation';

export { pixResource, pixOperations };

export const pixOperationExecute = {
	create,
	simulatePayment,
	checkStatus,
};
