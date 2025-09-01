import { withdrawResource, withdrawOperations } from './withdraw.resource';
import * as create from './create.operation';
import * as list from './list.operation';

export { withdrawResource, withdrawOperations };

export const withdrawOperationExecute = {
	create,
	list,
};
