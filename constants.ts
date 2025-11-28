
import { Operator, PaymentMethod } from './types';

export const ADMIN_PHONE_NUMBER = "258871039516";
export const TELEGRAM_PHONE_NUMBER = "258861518153";
export const ADMIN_EMAIL = "moladigital79@gmail.com";
export const USDT_EXCHANGE_RATE = 70;

export const OPERATORS: Operator[] = [
  { 
    id: 'vodacom', 
    name: 'Vodacom', 
    color: 'bg-red-600', 
    logoText: 'V',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Vodacom_Logo_2018.svg/512px-Vodacom_Logo_2018.svg.png'
  },
  { 
    id: 'movitel', 
    name: 'Movitel', 
    color: 'bg-orange-500', 
    logoText: 'M',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Movitel_logo.png' 
  },
  { 
    id: 'tmcel', 
    name: 'Tmcel', 
    color: 'bg-yellow-400', 
    logoText: 'T',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Tmcel_logo.svg/512px-Tmcel_logo.svg.png'
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'mpesa', name: 'M-Pesa', discountPercent: 3, icon: '📱' },
  { id: 'emola', name: 'e-Mola', discountPercent: 2, icon: '💸' },
  { id: 'usdt', name: 'USDT', discountPercent: 2, icon: '🪙' },
];

export const PAYMENT_DESTINATIONS = {
  mpesa: '845637724',
  emola: '861518153',
  usdt_binance_id: '738620458',
  usdt_wallet: '0x52bcea7f0b275e7b9462b7169f616a04fb79dbbe'
};

export const SYSTEM_INSTRUCTION = `
Você é o assistente virtual da "Recargas Digital — by Mukutsure Service".
Sua função é ajudar clientes em Moçambique a comprar recargas de celular e tirar dúvidas.

Informações importantes:
1. Operadoras suportadas: Vodacom, Movitel, Tmcel.
2. Métodos de Pagamento e Descontos:
   - M-Pesa (3% OFF): Transferir para 845637724.
   - e-Mola (2% OFF): Transferir para 861518153.
   - USDT (2% OFF): Binance ID 738620458 ou Rede BEP20. Taxa de câmbio: 70 MT = 1 USDT.
3. Processo de Compra: 
   - O cliente preenche os dados no app.
   - Realiza a transferência manual para os números indicados.
   - Anexa o comprovativo (foto/screenshot) no app.
   - Clica em Confirmar para enviar os dados via WhatsApp.
4. Número do Suporte (WhatsApp): +258 87 103 9516.
5. Horário de funcionamento: 24/7 (automático), suporte humano das 8h às 20h.

Seja educado, curto e direto. Use emojis ocasionalmente. Se o cliente relatar um erro grave, peça para clicar no botão de WhatsApp para falar com humano.
`;

export const TRANSLATIONS = {
  pt: {
    appTitle: 'Recargas Digital',
    buy: 'Comprar',
    history: 'Histórico',
    chooseOperator: 'Escolha a Operadora',
    rechargeDetails: 'Detalhes da Recarga',
    numberToRecharge: 'Número a Recarregar',
    rechargeAmount: 'Valor da Recarga',
    paymentMethod: 'Forma de Pagamento',
    yourMpesaNumber: 'Seu Número M-Pesa (Pagador)',
    yourEmolaNumber: 'Seu Número e-Mola (Pagador)',
    transferTo: 'Transfira',
    payNowUSSD: 'Pagar Agora (USSD)',
    totalToPayUSDT: 'Total a Pagar (USDT)',
    exchangeRate: 'Câmbio',
    walletAddress: 'Endereço Carteira (BEP20)',
    usdtInstruction: 'Ao pagar com USDT, carregue o comprovativo (Hash ou Screenshot) abaixo.',
    totalToPay: 'Total a Pagar',
    confirm: 'Confirmar',
    savings: 'Poupa',
    proofOfPayment: 'Comprovativo de Pagamento',
    tapToUpload: 'Toque para carregar foto',
    clickToChange: 'Clique para alterar',
    historyTitle: 'Histórico de Pedidos',
    noHistory: 'Nenhum pedido realizado ainda.',
    makeFirstRecharge: 'Fazer primeira recarga',
    pending: 'Pendente',
    completed: 'Concluído',
    proofAttached: 'Comprovativo anexado',
    alertValidAmount: 'Por favor, insira um valor válido.',
    alertValidPhone: 'Por favor, insira o número de telefone a recarregar.',
    alertValidPayerPhone: 'Por favor, insira o seu número que fará o pagamento.',
    alertUploadProof: 'Por favor, carregue a imagem do comprovativo de pagamento para continuar.',
    alertWhatsApp: 'O WhatsApp será aberto. Por favor, não se esqueça de anexar/enviar a imagem do comprovativo na conversa.',
    darkMode: 'Modo Escuro',
    lightMode: 'Modo Claro',
    language: 'Idioma'
  },
  en: {
    appTitle: 'Digital Recharges',
    buy: 'Buy',
    history: 'History',
    chooseOperator: 'Choose Operator',
    rechargeDetails: 'Recharge Details',
    numberToRecharge: 'Phone Number',
    rechargeAmount: 'Amount',
    paymentMethod: 'Payment Method',
    yourMpesaNumber: 'Your M-Pesa Number (Payer)',
    yourEmolaNumber: 'Your e-Mola Number (Payer)',
    transferTo: 'Transfer',
    payNowUSSD: 'Pay Now (USSD)',
    totalToPayUSDT: 'Total to Pay (USDT)',
    exchangeRate: 'Rate',
    walletAddress: 'Wallet Address (BEP20)',
    usdtInstruction: 'When paying with USDT, upload the proof (Hash or Screenshot) below.',
    totalToPay: 'Total to Pay',
    confirm: 'Confirm',
    savings: 'Save',
    proofOfPayment: 'Proof of Payment',
    tapToUpload: 'Tap to upload photo',
    clickToChange: 'Click to change',
    historyTitle: 'Order History',
    noHistory: 'No orders yet.',
    makeFirstRecharge: 'Make first recharge',
    pending: 'Pending',
    completed: 'Completed',
    proofAttached: 'Proof attached',
    alertValidAmount: 'Please enter a valid amount.',
    alertValidPhone: 'Please enter the phone number to recharge.',
    alertValidPayerPhone: 'Please enter your payer phone number.',
    alertUploadProof: 'Please upload the payment proof image to continue.',
    alertWhatsApp: 'WhatsApp will open. Please do not forget to attach/send the proof image in the chat.',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language'
  }
};
