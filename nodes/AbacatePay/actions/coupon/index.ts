import { couponResource, couponOperations } from './coupon.resource';
import * as create from './create.operation';
import * as list from './list.operation';

export { couponResource, couponOperations };

export const couponOperationExecute = {
	create,
	list,
};
