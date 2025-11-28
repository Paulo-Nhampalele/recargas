
import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  History, 
  CheckCircle, 
  Copy, 
  ArrowRight,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  Smartphone,
  Globe,
  Lock,
  FileText,
  X,
  Check,
  Download,
  Mail,
  MessageCircle,
  Send
} from 'lucide-react';
import { ChatSupport } from './components/ChatSupport';
import { OPERATORS, PAYMENT_METHODS, ADMIN_PHONE_NUMBER, TELEGRAM_PHONE_NUMBER, ADMIN_EMAIL, PAYMENT_DESTINATIONS, USDT_EXCHANGE_RATE, TRANSLATIONS } from './constants';
import { OperatorId, PaymentMethodId, Transaction, Language } from './types';

// Simple navigation tabs
type Tab = 'home' | 'history' | 'admin';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
  // Settings State
  const [language, setLanguage] = useState<Language>('pt');
  
  // Form State
  const [selectedOperator, setSelectedOperator] = useState<OperatorId>('vodacom');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('mpesa');
  const [paymentFromNumber, setPaymentFromNumber] = useState(''); // Number user is paying FROM
  
  // Proof of Payment State
  const [proofFile, setProofFile] = useState<File | null>(null);
  
  // Validation Errors State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // History State
  const [history, setHistory] = useState<Transaction[]>([]);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Modal States
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [successTransaction, setSuccessTransaction] = useState<Transaction | null>(null);

  // UI Feedback State
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Translations helper
  const t = TRANSLATIONS[language];

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|ipad|iphone|ipod/i.test(userAgent);
    };
    setIsMobile(checkMobile());

    // Load persisted state
    const savedHistory = localStorage.getItem('recargas_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const savedLang = localStorage.getItem('recargas_lang') as Language;
    if (savedLang) setLanguage(savedLang);

    // Enforce Light Mode
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('recargas_theme');

  }, []);

  // Update Language
  useEffect(() => {
    localStorage.setItem('recargas_lang', language);
  }, [language]);

  // Reset proof when method or amount changes
  useEffect(() => {
    setProofFile(null);
    setErrors({}); // Clear errors on context change
  }, [paymentMethod, amount, selectedOperator]);

  const saveTransaction = (transaction: Transaction) => {
    const newHistory = [transaction, ...history];
    setHistory(newHistory);
    localStorage.setItem('recargas_history', JSON.stringify(newHistory));
  };

  const updateTransactionStatus = (id: string, status: 'completed' | 'rejected', notes?: string) => {
    const updatedHistory = history.map(tx => 
      tx.id === id ? { ...tx, status, adminNotes: notes || tx.adminNotes } : tx
    );
    setHistory(updatedHistory);
    localStorage.setItem('recargas_history', JSON.stringify(updatedHistory));
  };

  const toggleLanguage = () => setLanguage(prev => prev === 'pt' ? 'en' : 'pt');

  // Calculations
  const numericAmount = parseFloat(amount) || 0;
  const activeMethod = PAYMENT_METHODS.find(p => p.id === paymentMethod);
  const discountAmount = numericAmount * ((activeMethod?.discountPercent || 0) / 100);
  const finalAmount = numericAmount - discountAmount;
  
  // USDT Calculation
  const usdtAmount = finalAmount / USDT_EXCHANGE_RATE;

  // Input Handling for Phones (Max 9 digits, Numbers only)
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, fieldName: string) => {
    const val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (val.length <= 9) {
      setter(val);
      // Clear error for this field if it exists
      if (errors[fieldName]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
      }
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const generateOrderMessage = (transaction: Transaction) => {
    const activeOp = OPERATORS.find(o => o.id === transaction.operator);
    const activeMethod = PAYMENT_METHODS.find(p => p.id === transaction.paymentMethod);
    
    let paymentDetailsMsg = '';
    if (transaction.paymentMethod === 'mpesa' && transaction.paymentFrom) {
      paymentDetailsMsg = `\n📱 *Pago via M-Pesa:* ${transaction.paymentFrom}`;
    } else if (transaction.paymentMethod === 'emola' && transaction.paymentFrom) {
      paymentDetailsMsg = `\n💸 *Pago via e-Mola:* ${transaction.paymentFrom}`;
    } else if (transaction.paymentMethod === 'usdt') {
      const uAmount = transaction.finalAmount / USDT_EXCHANGE_RATE;
      paymentDetailsMsg = `\n🪙 *Pago via USDT:* ${uAmount.toFixed(2)} USDT\n💱 *Câmbio:* ${USDT_EXCHANGE_RATE} MT/USDT`;
    }

    return `Ola Mukutsure Service,\n\n*NOVO PEDIDO DE RECARGA*\n---------------------------\n🆔 *ID:* ${transaction.id}\n📱 *Recarregar:* ${transaction.phoneNumber}\n📡 *Operadora:* ${activeOp?.name}\n💰 *Valor:* ${transaction.amount} MT\n💳 *Pagamento:* ${activeMethod?.name}${paymentDetailsMsg}\n🏷️ *Desconto:* ${activeMethod?.discountPercent}%\n💵 *Valor Final:* ${transaction.finalAmount.toFixed(2)} MT\n---------------------------\n\n✅ O comprovativo segue em anexo.`;
  };

  const handleCheckout = () => {
    // Reset errors
    const newErrors: { [key: string]: string } = {};

    // Validate Amount
    if (!amount || numericAmount <= 0) {
      newErrors.amount = t.alertValidAmount;
    }

    // Validate Recipient Phone
    if (!phoneNumber || phoneNumber.length !== 9) {
      newErrors.phoneNumber = 'O número deve ter 9 dígitos (Ex: 841234567).';
    }

    // Validation for specific payment methods
    if (paymentMethod === 'mpesa' || paymentMethod === 'emola') {
      if (!paymentFromNumber || paymentFromNumber.length !== 9) {
        newErrors.paymentFrom = 'O número do pagador deve ter 9 dígitos.';
      }
    }

    // Validate Proof
    if (!proofFile) {
      newErrors.proof = t.alertUploadProof;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save to local history
    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(language === 'pt' ? 'pt-MZ' : 'en-US'),
      operator: selectedOperator,
      phoneNumber,
      amount: numericAmount,
      finalAmount,
      paymentMethod,
      paymentFrom: paymentFromNumber || undefined,
      hasProof: true,
      status: 'pending'
    };
    
    saveTransaction(transaction);
    setSuccessTransaction(transaction); // Open Success Modal

    // Reset Form
    setPhoneNumber('');
    setAmount('');
    setPaymentFromNumber('');
    setProofFile(null);
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'paulo2025') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setActiveTab('admin');
    } else {
      alert('Senha incorreta!');
    }
  };

  const ReceiptModal = ({ transaction, onClose }: { transaction: Transaction, onClose: () => void }) => {
    const op = OPERATORS.find(o => o.id === transaction.operator);
    // const method = PAYMENT_METHODS.find(p => p.id === transaction.paymentMethod);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* Header */}
          <div className="bg-blue-600 p-6 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                 <Check className="text-blue-600" size={24} strokeWidth={4} />
               </div>
               <h2 className="text-xl font-bold">Recibo de Pagamento</h2>
               <p className="text-blue-100 text-sm">Recargas Digital</p>
             </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 bg-slate-50">
             <div className="flex justify-between items-center border-b border-slate-200 pb-4">
               <span className="text-slate-500 text-sm">Valor Pago</span>
               <span className="text-2xl font-bold text-slate-800">{transaction.finalAmount.toFixed(2)} MT</span>
             </div>

             <div className="space-y-3 text-sm">
               <div className="flex justify-between">
                 <span className="text-slate-500">Operadora</span>
                 <span className="font-bold">{op?.name}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Número</span>
                 <span className="font-mono">{transaction.phoneNumber}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Data</span>
                 <span>{transaction.date}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">ID da Transação</span>
                 <span className="font-mono text-xs text-slate-400">{transaction.id}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Status</span>
                 <span className="text-green-600 font-bold uppercase text-xs bg-green-100 px-2 py-0.5 rounded-full">Concluído</span>
               </div>
             </div>
          </div>

          {/* Footer / Actions */}
          <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
            >
              Fechar
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
            >
              <Download size={16} /> Salvar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SuccessModal = ({ transaction, onClose }: { transaction: Transaction, onClose: () => void }) => {
    const message = generateOrderMessage(transaction);
    const whatsappUrl = `https://wa.me/${ADMIN_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    const telegramUrl = `https://t.me/${TELEGRAM_PHONE_NUMBER}`; // Generic link to chat
    const mailtoUrl = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent('Novo Pedido - ' + transaction.id)}&body=${encodeURIComponent(message)}`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 text-center space-y-6">
           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle size={32} />
           </div>
           
           <div>
             <h2 className="text-xl font-bold text-slate-900 mb-2">Pedido Registado!</h2>
             <p className="text-sm text-slate-600">
               Para processarmos sua recarga rapidamente, por favor, <strong>envie o comprovativo</strong> por um dos canais abaixo:
             </p>
           </div>

           <div className="space-y-3">
             <a 
               href={whatsappUrl} 
               target="_blank" 
               rel="noreferrer"
               className="flex items-center justify-center gap-3 w-full p-3 bg-[#25D366] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
             >
               <MessageCircle size={20} />
               Enviar via WhatsApp
             </a>
             
             <a 
               href={telegramUrl} 
               target="_blank" 
               rel="noreferrer"
               className="flex items-center justify-center gap-3 w-full p-3 bg-[#0088cc] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
             >
               <Send size={20} />
               Enviar via Telegram
             </a>

             <a 
               href={mailtoUrl}
               className="flex items-center justify-center gap-3 w-full p-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-200 transition-colors"
             >
               <Mail size={20} />
               Enviar via Email
             </a>
           </div>

           <button 
             onClick={onClose}
             className="text-slate-400 text-sm hover:text-slate-600 font-medium"
           >
             Agora não (ver histórico)
           </button>
        </div>
      </div>
    );
  };

  const FileUploadField = () => (
    <div className="mt-4">
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">{t.proofOfPayment}</label>
        <div 
            onClick={() => setErrors(prev => ({...prev, proof: ''}))}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
            errors.proof
            ? 'border-red-500 bg-red-50'
            : proofFile 
            ? 'border-green-500 bg-green-50' 
            : 'border-slate-300 hover:bg-slate-50'
        }`}>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    setProofFile(e.target.files?.[0] || null);
                    if (errors.proof) setErrors(prev => ({...prev, proof: ''}));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {proofFile ? (
                <div className="flex items-center gap-3 text-green-700 z-0">
                    <ImageIcon size={24} />
                    <div className="text-left overflow-hidden">
                        <p className="text-sm font-bold truncate max-w-[150px]">{proofFile.name}</p>
                        <p className="text-[10px] text-green-600">{t.clickToChange}</p>
                    </div>
                    <CheckCircle size={20} className="text-green-500 ml-2" />
                </div>
            ) : (
                <div className="flex flex-col items-center gap-1 z-0">
                    <UploadCloud size={24} className={errors.proof ? "text-red-500" : "text-slate-400"} />
                    <p className={`text-sm font-medium ${errors.proof ? 'text-red-500' : 'text-slate-600'}`}>
                        {errors.proof ? errors.proof : t.tapToUpload}
                    </p>
                    <p className="text-[10px] text-slate-400">JPG, PNG, Screenshot</p>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 pb-24 md:pb-0">
      
      {/* Receipt Modal */}
      {receiptTransaction && (
        <ReceiptModal 
          transaction={receiptTransaction} 
          onClose={() => setReceiptTransaction(null)} 
        />
      )}

      {/* Success / Notification Selection Modal */}
      {successTransaction && (
        <SuccessModal
          transaction={successTransaction}
          onClose={() => {
            setSuccessTransaction(null);
            setActiveTab('history');
          }}
        />
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xs p-6 rounded-2xl shadow-2xl border border-slate-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Admin Login</h3>
                <button onClick={() => setShowAdminLogin(false)}><X size={20} className="text-slate-500" /></button>
             </div>
             <input 
               type="password" 
               placeholder="Senha" 
               className="w-full p-3 mb-4 rounded-xl border border-slate-300"
               value={adminPassword}
               onChange={e => setAdminPassword(e.target.value)}
             />
             <button 
               onClick={handleAdminLogin}
               className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700"
             >
               Entrar
             </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold text-xl">R</div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight hidden sm:block">{t.appTitle}</h1>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight sm:hidden">Recargas</h1>
          </div>
          <div className="flex items-center gap-2">
             
             {/* Admin Toggle */}
             <button onClick={() => isAdmin ? setActiveTab('admin') : setShowAdminLogin(true)} className={`p-2 rounded-full transition-colors ${isAdmin ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                <Lock size={20} />
             </button>
             
             {/* Language Toggle */}
             <button onClick={toggleLanguage} className="flex items-center gap-1 px-2 py-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors font-medium text-xs">
                <Globe size={16} />
                <span>{language.toUpperCase()}</span>
             </button>

             <div className="h-6 w-px bg-slate-200 mx-1"></div>

             <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('home')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeTab === 'home' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.buy}
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.history}
                </button>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Operator Selection */}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">{t.chooseOperator}</h2>
              <div className="grid grid-cols-3 gap-3">
                {OPERATORS.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOperator(op.id)}
                    className={`relative overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all border-2 h-32 ${
                      selectedOperator === op.id 
                        ? `${op.color.replace('bg-', 'border-')} bg-white shadow-lg scale-[1.02]` 
                        : 'border-transparent bg-white text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-full h-16 flex items-center justify-center relative">
                      <img 
                        src={op.logoUrl} 
                        alt={op.name} 
                        className="max-w-full max-h-full object-contain drop-shadow-sm select-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = '0';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      {/* Fallback Text Logo */}
                      <div className={`hidden absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${op.color}`}>
                        {op.logoText}
                      </div>
                    </div>
                    
                    <span className={`text-sm font-bold ${selectedOperator === op.id ? 'text-slate-900' : 'text-slate-400'}`}>
                      {op.name}
                    </span>
                    
                    {selectedOperator === op.id && (
                      <div className="absolute top-2 right-2 text-blue-600">
                        <CheckCircle size={18} className="fill-blue-600 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Input Details */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.rechargeDetails}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.numberToRecharge}</label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.phoneNumber ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => handlePhoneInput(e, setPhoneNumber, 'phoneNumber')}
                      placeholder="84/85 123 4567"
                      className={`w-full pl-10 p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-lg text-slate-900 ${
                        errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.rechargeAmount}</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${errors.amount ? 'text-red-400' : 'text-slate-400'}`}>MT</span>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (errors.amount) setErrors(prev => ({...prev, amount: ''}));
                      }}
                      placeholder="100"
                      className={`w-full pl-10 p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-lg text-slate-900 ${
                        errors.amount ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {errors.amount && <p className="text-red-500 text-xs mt-1 font-medium">{errors.amount}</p>}
                </div>
              </div>
            </section>

            {/* Payment Method Selection */}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">{t.paymentMethod}</h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setPaymentFromNumber('');
                      setProofFile(null);
                      setErrors({});
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === method.id 
                        ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-800">{method.name}</div>
                      <div className="text-[10px] text-green-600 font-medium">-{method.discountPercent}% OFF</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Dynamic Payment Instructions Area */}
              <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                   {activeMethod?.icon && <span className="text-6xl">{activeMethod.icon}</span>}
                </div>

                {/* M-PESA */}
                {paymentMethod === 'mpesa' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 relative z-10">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t.yourMpesaNumber}</label>
                      <input 
                        type="tel" 
                        value={paymentFromNumber}
                        onChange={(e) => handlePhoneInput(e, setPaymentFromNumber, 'paymentFrom')}
                        placeholder="84..."
                        className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-900 ${
                            errors.paymentFrom ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                        }`}
                      />
                      {errors.paymentFrom && <p className="text-red-500 text-xs mt-1 font-medium">{errors.paymentFrom}</p>}
                    </div>
                    
                    {/* Instructions + Manual Copy */}
                    <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300">
                      <p className="text-sm text-slate-700 mt-2">
                        {t.transferTo} <strong>{finalAmount > 0 ? finalAmount.toFixed(2) : '...'} MT</strong>:
                      </p>
                      <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200 mb-4">
                        <span className="font-mono text-lg font-bold text-slate-800 flex-1">{PAYMENT_DESTINATIONS.mpesa}</span>
                        <button 
                          onClick={() => copyToClipboard(PAYMENT_DESTINATIONS.mpesa, 'mpesa')}
                          className="p-2 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
                        >
                          {copiedText === 'mpesa' ? <CheckCircle size={18} className="text-green-600"/> : <Copy size={18} />}
                        </button>
                      </div>

                      {/* USSD Mobile Only Button */}
                      {isMobile && finalAmount > 0 && (
                        <a 
                          href="tel:*150#"
                          className="flex items-center justify-center gap-2 w-full p-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md"
                        >
                          <Smartphone size={20} />
                          {t.payNowUSSD} (*150#)
                        </a>
                      )}
                    </div>
                    
                    <FileUploadField />
                  </div>
                )}

                {/* E-MOLA */}
                {paymentMethod === 'emola' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 relative z-10">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t.yourEmolaNumber}</label>
                      <input 
                        type="tel" 
                        value={paymentFromNumber}
                        onChange={(e) => handlePhoneInput(e, setPaymentFromNumber, 'paymentFrom')}
                        placeholder="86/87..."
                        className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-900 ${
                            errors.paymentFrom ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                        }`}
                      />
                      {errors.paymentFrom && <p className="text-red-500 text-xs mt-1 font-medium">{errors.paymentFrom}</p>}
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300">
                      <p className="text-sm text-slate-700 mt-2">
                         {t.transferTo} <strong>{finalAmount > 0 ? finalAmount.toFixed(2) : '...'} MT</strong>:
                      </p>
                      <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200 mb-4">
                        <span className="font-mono text-lg font-bold text-slate-800 flex-1">{PAYMENT_DESTINATIONS.emola}</span>
                        <button 
                          onClick={() => copyToClipboard(PAYMENT_DESTINATIONS.emola, 'emola')}
                          className="p-2 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
                        >
                          {copiedText === 'emola' ? <CheckCircle size={18} className="text-green-600"/> : <Copy size={18} />}
                        </button>
                      </div>

                      {/* USSD Mobile Only Button */}
                      {isMobile && finalAmount > 0 && (
                        <a 
                          href="tel:*898#"
                          className="flex items-center justify-center gap-2 w-full p-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-md"
                        >
                          <Smartphone size={20} />
                          {t.payNowUSSD} (*898#)
                        </a>
                      )}
                    </div>
                    
                    <FileUploadField />
                  </div>
                )}

                {/* USDT */}
                {paymentMethod === 'usdt' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 relative z-10">
                     <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 space-y-4">
                      
                      {/* USDT Conversion Display */}
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
                         <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase">{t.totalToPayUSDT}</p>
                            <p className="text-2xl font-bold text-slate-800">
                              {finalAmount > 0 ? usdtAmount.toFixed(2) : '0.00'} <span className="text-sm text-slate-500">USDT</span>
                            </p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] text-slate-500 font-medium">{t.exchangeRate}</p>
                           <p className="text-xs font-bold text-slate-700">1 USDT = {USDT_EXCHANGE_RATE} MT</p>
                         </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-semibold">Binance ID (Pay ID)</p>
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="font-mono text-sm font-bold text-slate-800 flex-1">{PAYMENT_DESTINATIONS.usdt_binance_id}</span>
                          <button 
                            onClick={() => copyToClipboard(PAYMENT_DESTINATIONS.usdt_binance_id, 'binance')}
                            className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
                          >
                            {copiedText === 'binance' ? <CheckCircle size={16} className="text-green-600"/> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                         <p className="text-xs text-slate-500 mb-1 font-semibold">{t.walletAddress}</p>
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="font-mono text-[10px] sm:text-xs text-slate-600 flex-1 break-all leading-tight">
                            {PAYMENT_DESTINATIONS.usdt_wallet}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(PAYMENT_DESTINATIONS.usdt_wallet, 'wallet')}
                            className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors shrink-0"
                          >
                            {copiedText === 'wallet' ? <CheckCircle size={16} className="text-green-600"/> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-xs">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                         <p>{t.usdtInstruction}</p>
                      </div>
                    </div>

                    <FileUploadField />
                  </div>
                )}

              </div>
            </section>

            {/* Total Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:static md:bg-transparent md:border-0 md:p-0 z-30">
               <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-2xl md:shadow-lg md:border md:border-slate-100">
                 <div>
                   <p className="text-xs text-slate-500 font-medium">{t.totalToPay}</p>
                   <div className="flex items-baseline gap-2">
                     <span className="text-2xl font-bold text-slate-900">{finalAmount > 0 ? finalAmount.toFixed(2) : '0.00'}</span>
                     <span className="text-sm font-bold text-slate-400">MT</span>
                     {discountAmount > 0 && (
                        <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                          {t.savings} {discountAmount.toFixed(2)} MT
                        </span>
                     )}
                   </div>
                 </div>
                 <button 
                  onClick={handleCheckout}
                  className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                 >
                   <span>{t.confirm}</span>
                   <ArrowRight size={20} />
                 </button>
               </div>
            </div>

            {/* Spacer for bottom fixed bar on mobile */}
            <div className="h-20 md:hidden"></div>

          </div>
        )}

        {/* ADMIN PANEL TAB */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-800">Painel do Administrador</h2>
               <button onClick={() => { setIsAdmin(false); setActiveTab('home'); }} className="text-red-500 text-sm font-bold">Sair</button>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-700">Pedidos Recentes</h3>
                </div>
                {history.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Nenhum pedido encontrado.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {history.map(tx => (
                      <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${tx.status === 'completed' ? 'bg-green-500' : tx.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                <span className="font-mono font-bold text-slate-900">{tx.id}</span>
                              </div>
                              <p className="text-xs text-slate-400">{tx.date}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-slate-800">{tx.finalAmount.toFixed(2)} MT</p>
                              <p className="text-xs text-slate-500 uppercase">{tx.operator}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3 bg-slate-100 p-3 rounded-lg">
                           <div><span className="text-slate-400 text-xs block">Número:</span> {tx.phoneNumber}</div>
                           <div><span className="text-slate-400 text-xs block">Método:</span> {PAYMENT_METHODS.find(p => p.id === tx.paymentMethod)?.name}</div>
                           {tx.paymentFrom && <div className="col-span-2"><span className="text-slate-400 text-xs block">Pagador:</span> {tx.paymentFrom}</div>}
                        </div>

                        {tx.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => updateTransactionStatus(tx.id, 'completed')}
                              className="flex-1 bg-green-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-green-700"
                            >
                              Aprovar
                            </button>
                            <button 
                              onClick={() => updateTransactionStatus(tx.id, 'rejected')}
                              className="flex-1 bg-red-100 text-red-600 text-sm font-bold py-2 rounded-lg hover:bg-red-200"
                            >
                              Rejeitar
                            </button>
                          </div>
                        )}

                        {tx.status === 'completed' && (
                          <div className="flex justify-end gap-2 mt-2">
                             <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                               <CheckCircle size={12}/> Aprovado
                             </span>
                             <button 
                               onClick={() => setReceiptTransaction(tx)}
                               className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"
                             >
                               <FileText size={12}/> Gerar Recibo
                             </button>
                          </div>
                        )}
                         {tx.status === 'rejected' && (
                           <div className="mt-2 text-right">
                              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Rejeitado</span>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-800">{t.historyTitle}</h2>
            {history.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 transition-colors">
                <History className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500">{t.noHistory}</p>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="text-blue-600 font-medium mt-2 hover:underline"
                >
                  {t.makeFirstRecharge}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((tx) => (
                  <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-colors">
                    <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center p-2 overflow-hidden">
                            <img 
                              src={OPERATORS.find(o => o.id === tx.operator)?.logoUrl} 
                              alt="Op"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{tx.phoneNumber}</div>
                            <div className="text-xs text-slate-500">{tx.date} • {PAYMENT_METHODS.find(p => p.id === tx.paymentMethod)?.name}</div>
                          </div>
                       </div>
                       <div className="text-right">
                         <div className="font-bold text-slate-900">{tx.finalAmount.toFixed(2)} MT</div>
                         <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${
                           tx.status === 'completed' 
                             ? 'text-green-700 bg-green-100 border border-green-200' 
                             : tx.status === 'rejected'
                             ? 'text-red-700 bg-red-100 border border-red-200'
                             : 'text-amber-700 bg-amber-100 border border-amber-200'
                         }`}>
                           {tx.status === 'completed' ? t.completed : tx.status === 'rejected' ? 'Rejeitado' : t.pending}
                         </div>
                       </div>
                    </div>
                    {tx.status === 'completed' && (
                       <button 
                         onClick={() => setReceiptTransaction(tx)}
                         className="w-full mt-2 py-2 text-xs font-bold text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                       >
                         <FileText size={14}/> Ver Recibo
                       </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Chat Support */}
      <ChatSupport />
      
    </div>
  );
};

export default App;
