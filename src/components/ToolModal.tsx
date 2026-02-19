import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, X, Save, AlertCircle, Calendar, ChevronDown } from 'lucide-react';

interface ToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tool: any) => void;
    initialData?: any;
    toolType: string;
}

export default function ToolModal({ isOpen, onClose, onSave, initialData, toolType }: ToolModalProps) {
    // Call Transfer fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [transferType, setTransferType] = useState('phone');
    const [destination, setDestination] = useState('');

    // Cal.com fields
    const [apiKey, setApiKey] = useState('');
    const [guestId, setGuestId] = useState('');
    const [baseUrl, setBaseUrl] = useState('https://api.cal.com');
    const [bookingType, setBookingType] = useState('recommended');
    const [smsName, setSmsName] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [canSendLink, setCanSendLink] = useState(false);
    const [placeholderEmail, setPlaceholderEmail] = useState('');

    // Search Request fields
    const [conditionDescription, setConditionDescription] = useState('');
    const [executionSentence, setExecutionSentence] = useState('');
    const [domainRestrictions, setDomainRestrictions] = useState('');

    // API Tool Call fields
    const [apiUrl, setApiUrl] = useState('');
    const [apiMethod, setApiMethod] = useState('POST');
    const [apiExecutionText, setApiExecutionText] = useState('');
    const [apiTimeout, setApiTimeout] = useState('5000');
    const [apiHeaders, setApiHeaders] = useState('{}');
    const [apiDynamicParams, setApiDynamicParams] = useState('{}');
    const [apiFixedParams, setApiFixedParams] = useState('{}');

    // API Section visibility
    const [showHeaders, setShowHeaders] = useState(false);
    const [showDynamicParams, setShowDynamicParams] = useState(false);
    const [showFixedParams, setShowFixedParams] = useState(false);

    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description);
                try {
                    const config = typeof initialData.config === 'string' ? JSON.parse(initialData.config) : initialData.config;

                    if (initialData.type === 'transfer') {
                        setTransferType(config.transferType || 'phone');
                        setDestination(config.destination || '');
                    } else if (initialData.type === 'calcom') {
                        setApiKey(config.apiKey || '');
                        setGuestId(config.guestId || '');
                        setBaseUrl(config.baseUrl || 'https://api.cal.com');
                        setBookingType(config.bookingType || 'recommended');
                        setSmsName(config.smsName || '');
                        setCanSendLink(config.canSendLink || false);
                        setPlaceholderEmail(config.placeholderEmail || '');
                    } else if (initialData.type === 'search') {
                        setConditionDescription(config.conditionDescription || '');
                        setExecutionSentence(config.executionSentence || '');
                        setDomainRestrictions(config.domainRestrictions || '');
                    } else if (initialData.type === 'api') {
                        setApiUrl(config.url || '');
                        setApiMethod(config.method || 'POST');
                        setApiExecutionText(config.executionText || '');
                        setApiTimeout(config.timeout || '5000');
                        setApiHeaders(config.headers || '{}');
                        setApiDynamicParams(config.dynamicParams || '{}');
                        setApiFixedParams(config.fixedParams || '{}');
                    }
                } catch (e) {
                    console.error('Error parsing config', e);
                }
            } else {
                // Reset all fields
                setName('');
                setDescription('');
                setTransferType('phone');
                setDestination('');
                setApiKey('');
                setGuestId('');
                setBaseUrl('https://api.cal.com');
                setBookingType('recommended');
                setSmsName('');
                setConditionDescription('');
                setExecutionSentence('');
                setDomainRestrictions('');
                setApiUrl('');
                setApiMethod('POST');
                setApiExecutionText('');
                setApiTimeout('5000');
                setApiHeaders('{}');
                setApiDynamicParams('{}');
                setApiFixedParams('{}');
                setShowHeaders(false);
                setShowDynamicParams(false);
                setShowFixedParams(false);
            }
            setError('');
        }
    }, [isOpen, initialData]);

    if (!isOpen || !mounted) return null;

    const handleSave = () => {
        if (toolType === 'transfer') {
            if (!name || !destination || !description) {
                setError('Please fill in all required fields');
                return;
            }
            onSave({
                id: initialData?.id,
                type: 'transfer',
                name,
                description,
                config: JSON.stringify({ transferType, destination }),
                enabled: true
            });
        } else if (toolType === 'calcom') {
            if (!name || !apiKey || !guestId) {
                setError('Please fill in all required fields');
                return;
            }
            onSave({
                id: initialData?.id,
                type: 'calcom',
                name,
                description,
                config: JSON.stringify({
                    apiKey,
                    guestId,
                    baseUrl,
                    bookingType,
                    smsName,
                    canSendLink,
                    placeholderEmail
                }),
                enabled: true
            });
        } else if (toolType === 'search') {
            if (!name || !conditionDescription) {
                setError('Please fill in all required fields');
                return;
            }
            onSave({
                id: initialData?.id,
                type: 'search',
                name,
                description, // Keeping the base description if needed, or using conditionDescription
                config: JSON.stringify({
                    conditionDescription,
                    executionSentence,
                    domainRestrictions
                }),
                enabled: true
            });
        } else if (toolType === 'api') {
            if (!name || !conditionDescription || !apiUrl) {
                setError('Please fill in all required fields');
                return;
            }
            onSave({
                id: initialData?.id,
                type: 'api',
                name,
                description,
                config: JSON.stringify({
                    conditionDescription,
                    url: apiUrl,
                    method: apiMethod,
                    executionText: apiExecutionText,
                    timeout: apiTimeout,
                    headers: apiHeaders,
                    dynamicParams: apiDynamicParams,
                    fixedParams: apiFixedParams
                }),
                enabled: true
            });
        }
    };

    const handleInsertExample = (type: string) => {
        let example = '';
        switch (type) {
            case 'Simple Object':
                example = JSON.stringify({
                    "type": "object",
                    "required": ["productId"],
                    "properties": {
                        "productId": {
                            "type": "string",
                            "description": "ID of the product"
                        }
                    }
                }, null, 2);
                break;
            case 'Object with Enum':
                example = JSON.stringify({
                    "type": "object",
                    "required": ["mode", "count"],
                    "properties": {
                        "mode": {
                            "type": "string",
                            "enum": ["fast", "slow", "medium"],
                            "description": "Operating Mode"
                        },
                        "count": {
                            "type": "integer",
                            "description": "Number of Elements"
                        }
                    }
                }, null, 2);
                break;
            case 'Object with Array':
                example = JSON.stringify({
                    "type": "object",
                    "required": ["values"],
                    "properties": {
                        "values": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "A list of values"
                        }
                    }
                }, null, 2);
                break;
            case 'Object with Nested Object':
                example = JSON.stringify({
                    "type": "object",
                    "required": ["config"],
                    "properties": {
                        "config": {
                            "type": "object",
                            "required": ["threshold", "options"],
                            "properties": {
                                "threshold": {
                                    "type": "number",
                                    "description": "Threshold value"
                                },
                                "options": {
                                    "type": "object",
                                    "required": ["flag", "tags"],
                                    "properties": {
                                        "flag": {
                                            "type": "boolean",
                                            "description": "Boolean option"
                                        },
                                        "tags": {
                                            "type": "array",
                                            "items": {
                                                "type": "string"
                                            },
                                            "description": "List of keywords"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, null, 2);
                break;
            case 'Object with Array of Nested Objects':
                example = JSON.stringify({
                    "type": "object",
                    "required": ["data"],
                    "properties": {
                        "data": {
                            "type": "array",
                            "description": "List of data objects",
                            "items": {
                                "type": "object",
                                "required": ["id", "name"],
                                "properties": {
                                    "id": {
                                        "type": "integer",
                                        "description": "Unique ID"
                                    },
                                    "name": {
                                        "type": "string",
                                        "description": "Name of the element"
                                    },
                                    "attributes": {
                                        "type": "object",
                                        "required": ["active"],
                                        "properties": {
                                            "active": {
                                                "type": "boolean",
                                                "description": "Indicates whether the element is active"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, null, 2);
                break;
        }
        setApiDynamicParams(example);
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Fixed */}
                <div className="p-6 pb-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {toolType === 'calcom' ? 'Cal.com Appointment Booking' :
                                toolType === 'search' ? 'Search Request' :
                                    toolType === 'api' ? 'API Tool Call' :
                                        'Call Transfer'}
                        </h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 px-6 py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}
                >
                    <div className="space-y-4">
                        {toolType === 'transfer' ? (
                            // Call Transfer Form
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Transfer to Sales"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Transfer Type</label>
                                    <select
                                        value={transferType}
                                        onChange={(e) => setTransferType(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    >
                                        <option value="phone">Phone Number</option>
                                        <option value="sip">SIP</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        {transferType === 'phone' ? 'Phone Number' : 'SIP URL'}
                                    </label>
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder={transferType === 'phone' ? '+44xxxxxxxxxxx' : 'demo.sip.com'}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                    {transferType === 'sip' && (
                                        <p className="text-xs text-slate-500">Specify the SIP URL without <code className="text-slate-700">sip:</code></p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Description</label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Call transfer to person x"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-orange-600 mb-2">Attention when testing:</p>
                                    <p className="text-xs text-orange-500">Transfers do not work with:</p>
                                    <ul className="text-xs text-orange-500 list-disc list-inside mt-1 space-y-1">
                                        <li>Test Audio</li>
                                        <li>Transfers to your own number (or a second number on the same device)</li>
                                    </ul>
                                </div>
                            </>
                        ) : toolType === 'calcom' ? (
                            // Cal.com Appointment Booking Form
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Book Consulting Appointment"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Appointment Description</label>
                                    <textarea
                                        rows={2}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Action of AI"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">API Key</label>
                                    <input
                                        type="text"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="cal_live_..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Guest ID</label>
                                    <input
                                        type="text"
                                        value={guestId}
                                        onChange={(e) => setGuestId(e.target.value)}
                                        placeholder="120129"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-500/50 transition-all"
                                    />
                                    <p className="text-xs text-slate-500">Go from me to called is test.host. You are using Lorem for this alias.  <a href="#" className="text-blue-500 underline">here</a></p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Guest Version</label>
                                    <input
                                        type="text"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        placeholder="https://api.cal.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Booking Type</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                value="recommended"
                                                checked={bookingType === 'recommended'}
                                                onChange={(e) => setBookingType(e.target.value)}
                                                className="text-blue-500"
                                            />
                                            <span className="text-sm text-slate-700">SMS (recommended)</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                value="email"
                                                checked={bookingType === 'email'}
                                                onChange={(e) => setBookingType(e.target.value)}
                                                className="text-blue-500"
                                            />
                                            <span className="text-sm text-slate-700">Email</span>
                                        </label>
                                    </div>
                                </div>

                                {/* SMS Session Name - Only show when SMS is selected */}
                                {bookingType === 'recommended' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">SMS Sender Name</label>
                                            <input
                                                type="text"
                                                value={smsName}
                                                onChange={(e) => setSmsName(e.target.value)}
                                                placeholder="name"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                            <p className="text-xs text-slate-500">This name will be used when sending the booking SMS.</p>
                                        </div>

                                        {/* SMS Booking Process */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                            <div className="flex items-start gap-2 mb-3">
                                                <span className="text-slate-400 text-xs mt-0.5">≡</span>
                                                <h4 className="text-sm font-medium text-slate-900">Process for SMS-based booking</h4>
                                            </div>
                                            <ol className="text-xs text-slate-600 space-y-1.5 ml-4 list-decimal">
                                                <li>Ask for desired time, suggest alternatives if unavailable</li>
                                                <li>Ask for first and last name</li>
                                                <li>Ask if the current number can be used for SMS confirmation – otherwise, collect alternative number</li>
                                                <li>Book appointment and confirm via SMS</li>
                                            </ol>
                                            <p className="text-xs text-slate-500 mt-3">
                                                For booking problems: SMS with booking link
                                            </p>
                                            <p className="text-xs text-slate-400 mt-2">
                                                Cost per SMS: €0.15
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* Email Booking Process - Only show when Email is selected */}
                                {bookingType === 'email' && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-start gap-2 mb-3">
                                            <span className="text-slate-400 text-xs mt-0.5">≡</span>
                                            <h4 className="text-sm font-medium text-slate-900">Process for Email-based booking</h4>
                                        </div>
                                        <ol className="text-xs text-slate-600 space-y-1.5 ml-4 list-decimal">
                                            <li>Ask for desired time, suggest alternatives if unavailable</li>
                                            <li>Ask for first and last name</li>
                                            <li>Ask for email address</li>
                                            <li>Book appointment - confirmation comes via email</li>
                                        </ol>
                                        <p className="text-xs text-slate-500 mt-3">
                                            For booking problems: Send SMS with booking link to caller
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Cost per SMS: €0.15
                                        </p>
                                    </div>
                                )}

                                {/* Advanced Settings - Only show when SMS is selected */}
                                {bookingType === 'recommended' && (
                                    <div className="border-t border-slate-200 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors w-full"
                                        >
                                            Advanced Settings
                                            <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showAdvanced && (
                                            <div className="mt-4 space-y-4">
                                                <div className="space-y-3">
                                                    <label className="flex items-start gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={canSendLink}
                                                            onChange={(e) => setCanSendLink(e.target.checked)}
                                                            className="mt-0.5"
                                                        />
                                                        <div>
                                                            <span className="text-sm text-slate-700 block">Assistant can send appointment booking link</span>
                                                            <span className="text-xs text-slate-500 mt-1 block">
                                                                If an error occurs while booking an appointment, the assistant can send the booking link to the caller directly
                                                            </span>
                                                        </div>
                                                    </label>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-700">Placeholder Email</label>
                                                    <input
                                                        type="email"
                                                        value={placeholderEmail}
                                                        onChange={(e) => setPlaceholderEmail(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                    />
                                                    <p className="text-xs text-slate-500">
                                                        An email must be specified even for SMS bookings. Default is guest@ai.
                                                        <br />
                                                        We recommend keeping this value or using a valid but unused address to avoid error messages.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : toolType === 'search' ? (
                            // Search Request Form
                            <>
                                <div className="mb-4 text-xs text-slate-500">
                                    The AI accesses websites live to provide information during the conversation.
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="search price on article page"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Condition & Description</label>
                                    <textarea
                                        rows={6}
                                        value={conditionDescription}
                                        onChange={(e) => setConditionDescription(e.target.value)}
                                        placeholder="Returns detailed information about products.&#10;&#10;Use the tool if the caller asks for product information that you cannot answer, e.g. prices, variants, ...&#10;&#10;Do not use the tool for other questions."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                    ></textarea>
                                    <p className="text-xs text-slate-500">Define when the search query should happen during the conversation.</p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Questions must be posed so that Google also finds results - specifically, product or order numbers must therefore be specified in the correct format.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Execution Sentence</label>
                                    <input
                                        type="text"
                                        value={executionSentence}
                                        onChange={(e) => setExecutionSentence(e.target.value)}
                                        placeholder="One moment, I just need to check."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                    <p className="text-xs text-slate-500">
                                        The AI needs 2-5 seconds to retrieve a website. Define an execution sentence as a filler.
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Leave this field empty if the AI should not speak during execution.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Domain Restrictions</label>
                                    <input
                                        type="text"
                                        value={domainRestrictions}
                                        onChange={(e) => setDomainRestrictions(e.target.value)}
                                        placeholder="domain.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Specify which domain(s) the AI should access. Domains must be confirmed with <span className="font-semibold">Enter</span>.
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        This field can be left empty if the AI should search the entire internet.
                                    </p>
                                </div>
                            </>
                        ) : toolType === 'api' ? (
                            // API Tool Call Form
                            <>
                                <div className="mb-4 text-xs text-slate-500">
                                    API Tool Calls are technically complex - especially for non-software developers. Feel free to contact <a href="mailto:support@fonio.ai" className="text-blue-500 hover:underline">support@fonio.ai</a> if you need help!
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Product Search"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Description & Condition</label>
                                        <textarea
                                            rows={4}
                                            value={conditionDescription}
                                            onChange={(e) => setConditionDescription(e.target.value)}
                                            placeholder="Returns information about a product. Should be called when the customer wants more information about a specific product."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                        ></textarea>
                                        <p className="text-xs text-slate-500">
                                            Based on this description, the AI decides whether to use the tool or not. The more precise the description of how it works and when it should be used, the better!
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">URL</label>
                                        <input
                                            type="text"
                                            value={apiUrl}
                                            onChange={(e) => setApiUrl(e.target.value)}
                                            placeholder="https://your-api.com"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Variables from the dynamic parameters can be used in the URL with <code className="bg-slate-100 px-1 rounded text-blue-600">{"{{variable}}"}</code>. Example: <code className="bg-slate-100 px-1 rounded text-slate-700">https://company/{"{{companyId}}"}?key={"{{key}}"}</code> &rarr; <code className="bg-slate-100 px-1 rounded text-slate-700">https://company/123?key=test</code>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Method</label>
                                        <select
                                            value={apiMethod}
                                            onChange={(e) => setApiMethod(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                            <option value="PUT">PUT</option>
                                            <option value="DELETE">DELETE</option>
                                            <option value="PATCH">PATCH</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Execution Text</label>
                                        <input
                                            type="text"
                                            value={apiExecutionText}
                                            onChange={(e) => setApiExecutionText(e.target.value)}
                                            placeholder="I'm looking for the product - one moment please!"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Text spoken during execution. Leave empty if nothing should be spoken during execution!
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Timeout (milliseconds)</label>
                                        <input
                                            type="number"
                                            value={apiTimeout}
                                            onChange={(e) => setApiTimeout(e.target.value)}
                                            placeholder="5000"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>

                                    {/* Collapsible Header Section */}
                                    <div className="border-t border-slate-200 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowHeaders(!showHeaders)}
                                            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                                        >
                                            <span>Header</span>
                                            <ChevronDown size={16} className={`transition-transform duration-200 ${showHeaders ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showHeaders && (
                                            <div className="mt-2 space-y-2">
                                                <textarea
                                                    rows={4}
                                                    value={apiHeaders}
                                                    onChange={(e) => setApiHeaders(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                ></textarea>
                                                <p className="text-[10px] text-slate-500">
                                                    Variables from the dynamic headers can be used with <code className="bg-slate-100 px-1 rounded text-blue-600">{"{{variable}}"}</code>. Example: <code className="bg-slate-100 px-1 rounded text-slate-700">{"{\"Authorization\": \"{{token}}\"}"}</code> &rarr; <code className="bg-slate-100 px-1 rounded text-slate-700">{"{\"Authorization\": \"Bearer 123\"}"}</code>
                                                    <br />
                                                    All variables are converted to strings.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Collapsible Dynamic Parameters Section */}
                                    <div className="border-t border-slate-200 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowDynamicParams(!showDynamicParams)}
                                            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                                        >
                                            <span>Dynamic Parameters</span>
                                            <ChevronDown size={16} className={`transition-transform duration-200 ${showDynamicParams ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showDynamicParams && (
                                            <div className="mt-2 space-y-4">
                                                <textarea
                                                    rows={10}
                                                    value={apiDynamicParams}
                                                    onChange={(e) => setApiDynamicParams(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                ></textarea>
                                                <div className="space-y-1">
                                                    {["Simple Object", "Object with Enum", "Object with Array", "Object with Nested Object", "Object with Array of Nested Objects"].map(ex => (
                                                        <button
                                                            key={ex}
                                                            type="button"
                                                            onClick={() => handleInsertExample(ex)}
                                                            className="block text-[10px] text-blue-500 hover:underline text-left"
                                                        >
                                                            • Insert Example "{ex}"
                                                        </button>
                                                    ))}
                                                    <p className="text-[10px] text-slate-500 mt-2">
                                                        – Use <a href="#" className="text-blue-500 hover:underline">our Generator</a> to create the structure
                                                        <br />
                                                        – Watch <a href="#" className="text-blue-500 hover:underline">this video</a> with an example
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Collapsible Default / Fixed Parameters Section */}
                                    <div className="border-t border-slate-200 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowFixedParams(!showFixedParams)}
                                            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                                        >
                                            <span>Default / Fixed Parameters</span>
                                            <ChevronDown size={16} className={`transition-transform duration-200 ${showFixedParams ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showFixedParams && (
                                            <div className="mt-2 space-y-2">
                                                <textarea
                                                    rows={4}
                                                    value={apiFixedParams}
                                                    onChange={(e) => setApiFixedParams(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                ></textarea>
                                                <p className="text-[10px] text-slate-500">
                                                    Default / Fixed parameters are used for values that do not need to be filled dynamically. They are overwritten if the same fields are dynamically filled! Example: API Key
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-6 pt-4 border-t border-slate-200">
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
