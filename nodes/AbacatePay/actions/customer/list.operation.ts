import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	// No additional fields needed for list operation
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('abacatePayApi');

	const options: IHttpRequestOptions = {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/customer/list`,
		json: false,
	};

	return await this.helpers.httpRequest(options);
}
