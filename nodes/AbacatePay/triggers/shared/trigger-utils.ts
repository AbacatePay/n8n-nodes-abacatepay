// Define todos os eventos disponíveis por domínio
export const triggerEvents = {
	customer: [
		{
			name: 'Customer Created',
			value: 'customer.created',
			description: 'Disparado quando um cliente é criado',
		},
		{
			name: 'Customer Updated',
			value: 'customer.updated',
			description: 'Disparado quando um cliente é atualizado',
		},
	],
	pix: [
		{
			name: 'PIX Payment Completed',
			value: 'pix.payment.completed',
			description: 'Disparado quando um pagamento PIX é concluído',
		},
		{
			name: 'PIX Payment Expired',
			value: 'pix.payment.expired',
			description: 'Disparado quando um QR Code PIX expira',
		},
		{
			name: 'PIX Payment Cancelled',
			value: 'pix.payment.cancelled',
			description: 'Disparado quando um pagamento PIX é cancelado',
		},
		{
			name: 'PIX QR Code Created',
			value: 'pix.qrcode.created',
			description: 'Disparado quando um QR Code PIX é criado',
		},
	],
	billing: [
		{
			name: 'Billing Created',
			value: 'billing.created',
			description: 'Disparado quando uma cobrança é criada',
		},
		{
			name: 'Billing Paid',
			value: 'billing.paid',
			description: 'Disparado quando uma cobrança é paga',
		},
		{
			name: 'Billing Expired',
			value: 'billing.expired',
			description: 'Disparado quando uma cobrança expira',
		},
		{
			name: 'Billing Cancelled',
			value: 'billing.cancelled',
			description: 'Disparado quando uma cobrança é cancelada',
		},
	],
	coupon: [
		{
			name: 'Coupon Created',
			value: 'coupon.created',
			description: 'Disparado quando um cupom é criado',
		},
		{
			name: 'Coupon Redeemed',
			value: 'coupon.redeemed',
			description: 'Disparado quando um cupom é utilizado',
		},
		{
			name: 'Coupon Expired',
			value: 'coupon.expired',
			description: 'Disparado quando um cupom expira',
		},
	],
	withdraw: [
		{
			name: 'Withdraw Created',
			value: 'withdraw.created',
			description: 'Disparado quando um saque é criado',
		},
		{
			name: 'Withdraw Completed',
			value: 'withdraw.completed',
			description: 'Disparado quando um saque é completado',
		},
		{
			name: 'Withdraw Failed',
			value: 'withdraw.failed',
			description: 'Disparado quando um saque falha',
		},
	],
};

// Função para obter todos os eventos organizados alfabeticamente
export function getAllTriggerEvents() {
	const allEvents = [
		...triggerEvents.billing,
		...triggerEvents.coupon,
		...triggerEvents.customer,
		...triggerEvents.pix,
		...triggerEvents.withdraw,
	];

	// Ordenar alfabeticamente por nome
	return allEvents.sort((a, b) => a.name.localeCompare(b.name));
}

// Função para determinar o tipo de recurso baseado nos dados
export function determineResourceType(data: any): 'customer' | 'pix' | 'billing' | 'coupon' | 'withdraw' | 'unknown' {
	// Lógica de detecção de PIX
	if (data.brCode || data.brCodeBase64 || (data.amount && data.status && data.id && data.id.startsWith('pix'))) {
		return 'pix';
	}

	// Lógica de detecção de Billing
	if (data.url || data.products || data.returnUrl || data.completionUrl || data.frequency) {
		return 'billing';
	}

	// Lógica de detecção de Customer
	if (data.name && data.email && data.taxId && data.cellphone) {
		return 'customer';
	}

	// Lógica de detecção de Coupon
	if (data.code && data.discountKind && typeof data.discount !== 'undefined') {
		return 'coupon';
	}

	// Lógica de detecção de Withdraw
	if (data.method && data.receiptUrl && data.kind === 'WITHDRAW') {
		return 'withdraw';
	}

	return 'unknown';
}

// Função para normalizar eventos baseado no tipo de recurso e status
export function normalizeEventType(resourceType: string, data: any, originalEvent: string): string {
	switch (resourceType) {
		case 'pix':
			if (data.status === 'PAID') return 'pix.payment.completed';
			if (data.status === 'EXPIRED') return 'pix.payment.expired';
			if (data.status === 'CANCELLED') return 'pix.payment.cancelled';
			if (data.status === 'PENDING') return 'pix.qrcode.created';
			break;

		case 'billing':
			if (data.status === 'PAID') return 'billing.paid';
			if (data.status === 'EXPIRED') return 'billing.expired';
			if (data.status === 'CANCELLED') return 'billing.cancelled';
			return 'billing.created';

		case 'customer':
			return originalEvent.includes('update') ? 'customer.updated' : 'customer.created';

		case 'coupon':
			if (data.status === 'EXPIRED') return 'coupon.expired';
			if (originalEvent.includes('redeem')) return 'coupon.redeemed';
			return 'coupon.created';

		case 'withdraw':
			if (data.status === 'COMPLETE') return 'withdraw.completed';
			if (data.status === 'CANCELLED' || data.status === 'FAILED') return 'withdraw.failed';
			return 'withdraw.created';
	}

	return originalEvent;
}
