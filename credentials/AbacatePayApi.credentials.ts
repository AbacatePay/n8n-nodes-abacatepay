import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class AbacatePayApi implements ICredentialType {
    name = 'abacatePayApi';
    displayName = 'AbacatePay API';
    documentationUrl = 'https://abacatepay.com';
    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            description: 'Sua chave de API no formato Bearer',
        },
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://api.abacatepay.com',
            description: 'URL base da API (altere se usar ambiente diferente)',
        },
    ];
    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '={{ "Bearer " + $credentials.apiKey }}',
            },
        },
    };

    	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/v1/customer/list',
		},
	};
}


