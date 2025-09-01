import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Nome completo do cliente',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Cellphone',
		name: 'cellphone',
		type: 'string',
		required: true,
		default: '',
		description: 'Celular do cliente',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		description: 'E-mail do cliente',
		placeholder: 'name@email.com',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Tax ID',
		name: 'taxId',
		type: 'string',
		required: true,
		default: '',
		description: 'CPF ou CNPJ do cliente',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['create'],
			},
		},
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('abacatePayApi');

	// Get customer data
	const name = this.getNodeParameter('name', i) as string;
	const cellphone = this.getNodeParameter('cellphone', i) as string;
	const email = this.getNodeParameter('email', i) as string;
	const taxId = this.getNodeParameter('taxId', i) as string;

	const body = {
		name,
		cellphone,
		email,
		taxId,
	};

	const options: IHttpRequestOptions = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/customer/create`,
		body,
		json: true,
	};

	return await this.helpers.httpRequest(options);
}
