
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ClipboardList,
  Box,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  ArrowRightLeft,
  MinusCircle,
  Trash2,
  Check,
  Building2,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { InventoryItem, Requisition, Profile, DepartmentEnum, UserRole, InventoryCategory } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Pagination } from './Pagination';

interface InventoryRequisitionPanelProps {
  currentUser: Profile;
  viewContext: string; // 'General' or Department Name
}

const BODEGA_GENERAL = 'Bodega General';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Pendiente': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'Aprobada': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Rechazada': return 'bg-red-50 text-red-700 border-red-200';
    case 'Entregada': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const InventoryRequisitionPanel: React.FC<InventoryRequisitionPanelProps> = ({ currentUser, viewContext }) => {
  // --- VISIBILITY LOGIC REFINED ---
  const isHRUser = currentUser.department === DepartmentEnum.HR_MATERIALS;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Lógica: "Inbox Mode" (Modo Bandeja de Entrada/Atención)
  // Solo activo si es RRHH o si es Admin viendo la vista GENERAL.
  // Si el Admin entra a una vista de departamento específico, pierde el "Inbox Mode" y ve "Sent Mode".
  const showInboxControls = isHRUser || (isAdmin && viewContext === 'General');

  // Permisos generales de visualización de bodega
  const canSeeBodega = isHRUser || (isAdmin && (viewContext === 'General' || viewContext === DepartmentEnum.HR_MATERIALS));
  
  // Default tab logic
  const [activeTab, setActiveTab] = useState<'requests' | 'inventory' | 'bodega'>(canSeeBodega ? 'bodega' : 'inventory');
  
  // View Control for Admin/HR (Inventory Tab)
  const [selectedTargetDept, setSelectedTargetDept] = useState<string>(
      isAdmin && viewContext !== 'General' ? viewContext : currentUser.department
  );

  // View Control for Admin/HR (Requests Tab - Only in Inbox Mode)
  const [reqFilterMode, setReqFilterMode] = useState<'STAFF' | 'RECTORY'>('STAFF');

  // Sincronizar selectedTargetDept cuando cambia el viewContext externo (navegación lateral)
  useEffect(() => {
      if (isAdmin && viewContext !== 'General') {
          setSelectedTargetDept(viewContext);
      } else if (!isAdmin && !isHRUser) {
          setSelectedTargetDept(currentUser.department);
      }
  }, [viewContext, isAdmin, isHRUser, currentUser.department]);
  
  // Data States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination States
  const [invPage, setInvPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);
  const [totalInventory, setTotalInventory] = useState(0);
  const [totalRequisitions, setTotalRequisitions] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- MODALS STATES ---
  
  // New Requisition
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [reqQuantity, setReqQuantity] = useState(1);
  const [reqJustification, setReqJustification] = useState('');
  const [reqObservations, setReqObservations] = useState('');
  const [reqTargetDept, setReqTargetDept] = useState(DepartmentEnum.HR_MATERIALS); // New: Target Department for the request
  const [fullInventoryList, setFullInventoryList] = useState<InventoryItem[]>([]); 
  
  // Transfer Stock (HR -> Dept)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [transferTargetDept, setTransferTargetDept] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState(1);

  // Consume Stock (Dept Usage)
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [consumeItem, setConsumeItem] = useState<InventoryItem | null>(null);
  const [consumeQuantity, setConsumeQuantity] = useState(1);

  // New Item (Catalog - HR Only)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem> & { initialStock: number, categoryId: string }>({ initialStock: 0, categoryId: '' });
  const [invCategories, setInvCategories] = useState<InventoryCategory[]>([]);
  const [previewCode, setPreviewCode] = useState('---');

  // Process Requisition Modal (Approve/Reject/Delete)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processingReq, setProcessingReq] = useState<Requisition | null>(null);
  const [actionType, setActionType] = useState<'Entregada' | 'Rechazada' | 'Eliminada' | null>(null);
  const [processObservation, setProcessObservation] = useState('');

  // Confirmation / Alerts
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Watch for permission changes
  useEffect(() => {
    if (activeTab === 'bodega' && !canSeeBodega) {
      setActiveTab('inventory');
    }
  }, [canSeeBodega, activeTab]);

  useEffect(() => {
    if (isRequestModalOpen && isSupabaseConfigured) {
        const loadCatalog = async () => {
            try {
                const { data: bodegaStock, error } = await supabase
                    .from('inventory_stock')
                    .select('quantity, inventory_items!inner(id, name)')
                    .eq('department', BODEGA_GENERAL);
                
                if (error) {
                    console.error("Error loading catalog:", error);
                    return; 
                }

                if (bodegaStock) {
                    const availableForRequest = bodegaStock.map((row: any) => ({
                        id: row.inventory_items.id,
                        name: row.inventory_items.name,
                        quantity: row.quantity
                    })) as any;
                    setFullInventoryList(availableForRequest);
                }
            } catch (e) {
                console.error("Error loading catalog for dropdown:", e);
            }
        };
        loadCatalog();
    }
  }, [isRequestModalOpen]);

  // Load Categories when Item Modal Opens
  useEffect(() => {
      if (isItemModalOpen && isSupabaseConfigured) {
          const loadCats = async () => {
              const { data } = await supabase.from('inventory_categories').select('*').order('name');
              if (data) setInvCategories(data);
          };
          loadCats();
      }
  }, [isItemModalOpen]);

  // Auto-generate code preview
  useEffect(() => {
      if (newItem.categoryId) {
          const cat = invCategories.find(c => c.id === newItem.categoryId);
          if (cat) {
              const nextSeq = cat.current_sequence + 1;
              const formattedSeq = String(nextSeq).padStart(3, '0');
              setPreviewCode(`${cat.prefix}-${formattedSeq}`);
          }
      } else {
          setPreviewCode('---');
      }
  }, [newItem.categoryId, invCategories]);

  // --- FETCH LOGIC ---

  const fetchInventory = async (page: number, limit: number) => {
    if (!isSupabaseConfigured) return; 

    setLoading(true);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let contextDepartment = currentUser.department;

    if (activeTab === 'bodega') {
        contextDepartment = BODEGA_GENERAL;
    } else {
        if (showInboxControls) {
            contextDepartment = selectedTargetDept;
        } else {
            // Si no estamos en modo inbox (ej. Admin viendo 'Académico' o Usuario normal),
            // el contexto es el departamento seleccionado o el del usuario
            contextDepartment = isAdmin && viewContext !== 'General' ? viewContext : currentUser.department;
        }
    }

    try {
        const { data: stockData, count, error: stockError } = await supabase
            .from('inventory_stock')
            .select('item_id, quantity, inventory_items!inner(*)', { count: 'exact' })
            .eq('department', contextDepartment)
            .range(start, end);

        if (stockError) throw stockError;

        if (stockData) {
            const mappedItems: InventoryItem[] = stockData.map((row: any) => ({
                ...row.inventory_items,
                quantity: row.quantity 
            }));
            setInventory(mappedItems);
            if (count !== null) setTotalInventory(count);
        } else {
            setInventory([]);
            setTotalInventory(0);
        }

    } catch (e) {
        console.error("Error fetching inventory:", e);
    } finally {
        setLoading(false);
    }
  };

  const fetchRequisitions = async (page: number, limit: number) => {
    if (!isSupabaseConfigured) return;

    setLoading(true);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let reqQuery = supabase
        .from('requisitions')
        .select('*, item:inventory_items(name)', { count: 'exact' })
        .order('created_at', { ascending: false });
    
    if (showInboxControls) {
        // --- MODO BANDEJA DE ENTRADA (Admin en General o RRHH) ---
        // Se muestran las solicitudes recibidas para ser atendidas.
        
        if (reqFilterMode === 'RECTORY') {
            // "A Rectoría": Solicitudes dirigidas explícitamente a Dirección/Rectoría
            reqQuery = reqQuery.eq('target_department', DepartmentEnum.DIRECTION);
        } else {
            // "Del Personal": Solicitudes dirigidas a RRHH/Materiales
            reqQuery = reqQuery.or(`target_department.eq.${DepartmentEnum.HR_MATERIALS},target_department.is.null`);
        }
    } else {
        // --- MODO HISTORIAL DE ENVÍOS (Usuario Normal o Admin en vista de Departamento) ---
        // Se muestran las solicitudes que han salido de este departamento.
        
        if (isAdmin && viewContext !== 'General') {
            // Admin viendo un departamento específico -> Ver todo lo enviado por ese departamento
            reqQuery = reqQuery.eq('department', viewContext);
        } else {
            // Usuario normal -> Ver solo lo que él mismo envió
            reqQuery = reqQuery.eq('requester_id', currentUser.id);
        }
    } 

    const { data, count, error } = await reqQuery.range(start, end);
    
    if (data) {
      const formattedReqs = data.map((r: any) => ({
        ...r,
        item_name: r.item?.name || 'Item eliminado'
      }));
      setRequisitions(formattedReqs);
    }
    if (count !== null) setTotalRequisitions(count);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'requests') {
        fetchRequisitions(reqPage, itemsPerPage);
    } else {
        fetchInventory(invPage, itemsPerPage);
    }
    // Added reqFilterMode dependency to refetch when dropdown changes
  }, [activeTab, invPage, reqPage, itemsPerPage, currentUser, viewContext, selectedTargetDept, reqFilterMode, showInboxControls]);

  // --- ACTIONS ---

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || reqQuantity <= 0) return;

    // Si estoy en una vista específica (Admin o Usuario), ese es el depto solicitante
    const requestDepartment = isAdmin && viewContext !== 'General' ? viewContext : currentUser.department;

    try {
      const { error } = await supabase.from('requisitions').insert({
        requester_id: currentUser.id,
        department: requestDepartment,
        target_department: reqTargetDept, // Guardamos a quién va dirigida
        item_id: selectedItemId,
        quantity: reqQuantity,
        justification: reqJustification,
        observations: reqObservations,
        status: 'Pendiente'
      });
      
      if (error) throw error;

      setIsRequestModalOpen(false);
      setSuccessMessage(`Solicitud enviada a ${reqTargetDept}.`);
      setIsSuccessModalOpen(true);
      resetReqForm();
      if(activeTab === 'requests') fetchRequisitions(reqPage, itemsPerPage);
    } catch (e) {
      alert("Error al crear solicitud. Verifica tu conexión.");
    }
  };

  const handleConsume = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!consumeItem || consumeQuantity <= 0) return;
      if (consumeQuantity > (consumeItem.quantity || 0)) {
          alert("No tienes suficiente stock para este consumo.");
          return;
      }

      // Contexto del consumo
      const contextDepartment = showInboxControls ? selectedTargetDept : (isAdmin && viewContext !== 'General' ? viewContext : currentUser.department);

      try {
          const newQty = (consumeItem.quantity || 0) - consumeQuantity;
          
          const { error } = await supabase
            .from('inventory_stock')
            .update({ quantity: newQty })
            .eq('item_id', consumeItem.id)
            .eq('department', contextDepartment);

          if (error) throw error;

          setIsConsumeModalOpen(false);
          setSuccessMessage('Consumo registrado. Inventario actualizado.');
          setIsSuccessModalOpen(true);
          fetchInventory(invPage, itemsPerPage);
      } catch (e) {
          alert("Error al registrar consumo.");
      }
  };

  const handleTransfer = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!transferItem || transferQuantity <= 0 || !transferTargetDept) return;
      if (transferQuantity > (transferItem.quantity || 0)) {
          alert("Stock insuficiente en Bodega General.");
          return;
      }

      try {
          const newBodegaQty = (transferItem.quantity || 0) - transferQuantity;
          const { error: decError } = await supabase
            .from('inventory_stock')
            .update({ quantity: newBodegaQty })
            .eq('item_id', transferItem.id)
            .eq('department', BODEGA_GENERAL);
          
          if(decError) throw decError;

          const { data: existingStock } = await supabase
            .from('inventory_stock')
            .select('id, quantity')
            .eq('item_id', transferItem.id)
            .eq('department', transferTargetDept)
            .single();

          if (existingStock) {
              await supabase
                .from('inventory_stock')
                .update({ quantity: existingStock.quantity + transferQuantity })
                .eq('id', existingStock.id);
          } else {
              await supabase
                .from('inventory_stock')
                .insert({
                    item_id: transferItem.id,
                    department: transferTargetDept,
                    quantity: transferQuantity
                });
          }

          setIsTransferModalOpen(false);
          setSuccessMessage(`Se asignaron ${transferQuantity} unidades a ${transferTargetDept}.`);
          setIsSuccessModalOpen(true);
          fetchInventory(invPage, itemsPerPage);

      } catch (e) {
          console.error(e);
          alert("Error en la asignación de stock.");
      }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.categoryId || previewCode === '---') return;

    try {
        const cat = invCategories.find(c => c.id === newItem.categoryId);
        if(!cat) throw new Error("Category not found");

        const { data: itemData, error: itemError } = await supabase
            .from('inventory_items')
            .insert({
                code: previewCode,
                name: newItem.name,
                category: cat.name,
                description: newItem.description
            })
            .select()
            .single();
        
        if (itemError) throw itemError;

        if (itemData) {
            await supabase.from('inventory_stock').insert({
                item_id: itemData.id,
                department: BODEGA_GENERAL,
                quantity: newItem.initialStock || 0
            });

            // Update category sequence
            await supabase.from('inventory_categories')
                .update({ current_sequence: cat.current_sequence + 1 })
                .eq('id', cat.id);
        }

        setIsItemModalOpen(false);
        setNewItem({ initialStock: 0, categoryId: '' });
        setSuccessMessage(`Producto ${previewCode} registrado correctamente.`);
        setIsSuccessModalOpen(true);
        fetchInventory(invPage, itemsPerPage);

    } catch (e) {
        alert("Error al registrar producto.");
    }
  };

  const initiateRequisitionAction = (req: Requisition, action: 'Entregada' | 'Rechazada' | 'Eliminada') => {
      setProcessingReq(req);
      setActionType(action);
      setProcessObservation('');
      setIsProcessModalOpen(true);
  };

  const confirmAction = async () => {
      if (!processingReq || !actionType) return;

      try {
          if (actionType === 'Entregada') {
              const { data: bodegaItem } = await supabase
                .from('inventory_stock')
                .select('quantity')
                .eq('item_id', processingReq.item_id)
                .eq('department', BODEGA_GENERAL)
                .single();
              
              if (!bodegaItem || bodegaItem.quantity < processingReq.quantity) {
                  alert("No hay suficiente stock en Bodega General para surtir esta solicitud.");
                  return;
              }

              await supabase
                .from('inventory_stock')
                .update({ quantity: bodegaItem.quantity - processingReq.quantity })
                .eq('item_id', processingReq.item_id)
                .eq('department', BODEGA_GENERAL);

              const { data: deptStock } = await supabase
                .from('inventory_stock')
                .select('id, quantity')
                .eq('item_id', processingReq.item_id)
                .eq('department', processingReq.department)
                .single();
              
              if (deptStock) {
                  await supabase.from('inventory_stock').update({ quantity: deptStock.quantity + processingReq.quantity }).eq('id', deptStock.id);
              } else {
                  await supabase.from('inventory_stock').insert({ item_id: processingReq.item_id, department: processingReq.department, quantity: processingReq.quantity });
              }
          } 
          
          if (actionType === 'Eliminada') {
              await supabase.from('requisitions').delete().eq('id', processingReq.id);
              setSuccessMessage('Solicitud eliminada correctamente.');
          } else {
              let finalObservations = processingReq.observations || '';
              if (processObservation.trim()) {
                  const timestamp = new Date().toLocaleDateString();
                  finalObservations += `${finalObservations ? '\n\n' : ''}[${timestamp} - ${actionType}]: ${processObservation}`;
              }

              await supabase.from('requisitions')
                .update({ 
                    status: actionType,
                    observations: finalObservations
                })
                .eq('id', processingReq.id);
              
              setSuccessMessage(actionType === 'Entregada' ? 'Solicitud surtida y stock actualizado.' : 'Solicitud rechazada.');
          }

          setIsProcessModalOpen(false);
          setProcessingReq(null);
          setActionType(null);
          setIsSuccessModalOpen(true);
          fetchRequisitions(reqPage, itemsPerPage);

      } catch (e) {
          console.error(e);
          alert("Error al procesar la solicitud.");
      }
  };

  const resetReqForm = () => {
    setSelectedItemId('');
    setReqQuantity(1);
    setReqJustification('');
    setReqObservations('');
    setReqTargetDept(DepartmentEnum.HR_MATERIALS);
  };

  const selectedItemForDisplay = fullInventoryList.find(i => i.id === selectedItemId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl text-blue-600 shadow-sm border border-blue-50">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Recursos Materiales</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {showInboxControls ? 'Gestión Global de Inventario' : `Inventario: ${isAdmin && viewContext !== 'General' ? viewContext : currentUser.department}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          {canSeeBodega && (
            <button 
              onClick={() => { setActiveTab('bodega'); setInvPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'bodega' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Box size={14} /> Bodega General
            </button>
          )}

          <button 
            onClick={() => { setActiveTab('inventory'); setInvPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardList size={14} /> Recursos Asignados
          </button>

          <button 
            onClick={() => { setActiveTab('requests'); setReqPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'requests' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShoppingCart size={14} /> Solicitudes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 bg-slate-50/30">
        
        {/* TAB: REQUESTS */}
        {activeTab === 'requests' && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              
              <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-700">
                    {/* TÍTULO CONDICIONAL: Solo si es modo Inbox (Admin General / RRHH) dice Solicitudes */}
                    {showInboxControls ? 'Solicitudes' : 'Solicitudes Enviadas'}
                  </h3>
                  
                  {/* SELECTOR PARA ADMIN/RRHH EN MODO INBOX UNICAMENTE */}
                  {showInboxControls && (
                      <div className="relative">
                          <select 
                              value={reqFilterMode}
                              onChange={(e) => {
                                  setReqFilterMode(e.target.value as 'STAFF' | 'RECTORY');
                                  setReqPage(1);
                              }}
                              className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:border-blue-300 transition-all"
                          >
                              <option value="STAFF">Del Personal</option>
                              <option value="RECTORY">A Rectoría</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                  )}
              </div>
              
              <button 
                  onClick={() => setIsRequestModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
              >
                  <Plus size={16} /> Nueva Solicitud
              </button>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : requisitions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ShoppingCart size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 font-medium">No hay solicitudes registradas en esta vista.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 mb-4">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                        <th className="py-3 pl-4">Artículo</th>
                        <th className="py-3">Cant.</th>
                        <th className="py-3">Departamento (Solicitante)</th>
                        {/* Mostramos destino para Admin en modo inbox */}
                        {showInboxControls && <th className="py-3">Dirigido A</th>}
                        <th className="py-3 hidden md:table-cell">Justificación</th>
                        <th className="py-3">Estado</th>
                        <th className="py-3 text-right pr-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
                        {requisitions.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 pl-4 font-bold text-slate-800">{req.item_name}</td>
                            <td className="py-3">{req.quantity}</td>
                            <td className="py-3">{req.department}</td>
                            {showInboxControls && (
                                <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${req.target_department === DepartmentEnum.DIRECTION ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {req.target_department === DepartmentEnum.DIRECTION ? 'Rectoría' : 'Recursos Materiales'}
                                    </span>
                                </td>
                            )}
                            <td className="py-3 max-w-[200px] truncate hidden md:table-cell" title={req.justification}>{req.justification}</td>
                            <td className="py-3">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(req.status)}`}>
                                {req.status}
                            </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {/* Botones de Aprobar/Rechazar SOLO en modo Inbox */}
                                    {showInboxControls && req.status === 'Pendiente' && (
                                        <>
                                            <button onClick={() => initiateRequisitionAction(req, 'Entregada')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Surtir y Completar">
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <button onClick={() => initiateRequisitionAction(req, 'Rechazada')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Rechazar">
                                                <X size={16} />
                                            </button>
                                        </>
                                    )}
                                    {req.status === 'Pendiente' && (
                                        <button onClick={() => initiateRequisitionAction(req, 'Eliminada')} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar Solicitud">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                <Pagination 
                    currentPage={reqPage}
                    totalItems={totalRequisitions}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setReqPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
              </>
            )}
          </div>
        )}

        {/* TAB: ASSIGNED RESOURCES OR BODEGA */}
        {(activeTab === 'inventory' || activeTab === 'bodega') && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              
              {/* VISTA DINÁMICA DEL TÍTULO / SELECTOR */}
              <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-700 whitespace-nowrap">
                      {activeTab === 'bodega' ? 'Existencias en Bodega General' : 'Recursos Asignados:'}
                  </h3>
                  
                  {activeTab === 'inventory' && showInboxControls ? (
                      // SELECTOR DEPARTAMENTOS PARA ADMIN/RRHH (INVENTARIO)
                      <div className="relative">
                          <select 
                              value={selectedTargetDept}
                              onChange={(e) => {
                                  setSelectedTargetDept(e.target.value);
                                  setInvPage(1); // Reset page on dept change
                              }}
                              className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:border-blue-300 transition-all"
                          >
                              {Object.values(DepartmentEnum).filter(d => d !== DepartmentEnum.HR_MATERIALS).map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                              ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                  ) : activeTab === 'inventory' ? (
                      // TEXTO ESTÁTICO PARA USUARIO NORMAL O ADMIN EN VISTA DEPTO
                      <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                          {isAdmin && viewContext !== 'General' ? viewContext : currentUser.department}
                      </span>
                  ) : null}
              </div>
              
              {activeTab === 'bodega' ? (
                  <button 
                    onClick={() => setIsItemModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg"
                  >
                    <Plus size={16} /> Registrar Nuevo Producto
                  </button>
              ) : (
                  // REDUNDANT BUTTON REMOVED HERE
                  <span className="text-[10px] text-slate-400 italic hidden sm:block">
                      {showInboxControls ? 'Visualizando inventario por área' : 'Gestiona tu inventario local'}
                  </span>
              )}
            </div>

            {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : (
                <>
                    {/* VISTA DESKTOP (TABLA) */}
                    <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 mb-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="py-3 pl-4">Código</th>
                                <th className="py-3">Producto</th>
                                <th className="py-3">Categoría</th>
                                {activeTab === 'inventory' && <th className="py-3">Área</th>}
                                <th className="py-3 text-center">Stock Actual</th>
                                <th className="py-3 text-right pr-4">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
                            {inventory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">No hay inventario registrado en esta área.</td>
                                </tr>
                            ) : (
                                inventory.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 pl-4 font-mono text-slate-500">{item.code}</td>
                                    <td className="py-3 font-bold text-slate-800">{item.name}</td>
                                    <td className="py-3">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">{item.category}</span>
                                    </td>
                                    {activeTab === 'inventory' && (
                                        <td className="py-3">
                                            <span className="flex items-center gap-1.5 text-slate-500">
                                                <Building2 size={12} /> {showInboxControls ? selectedTargetDept : (isAdmin && viewContext !== 'General' ? viewContext : currentUser.department)}
                                            </span>
                                        </td>
                                    )}
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full font-bold ${(item.quantity || 0) > 5 ? 'bg-green-100 text-green-700' : (item.quantity || 0) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.quantity}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                        {activeTab === 'bodega' ? (
                                            <button 
                                                onClick={() => { setTransferItem(item); setIsTransferModalOpen(true); }}
                                                className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 ml-auto font-bold"
                                            >
                                                <ArrowRightLeft size={14} /> Asignar
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => { setConsumeItem(item); setIsConsumeModalOpen(true); }}
                                                className="text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 ml-auto font-bold"
                                            >
                                                <MinusCircle size={14} /> Consumir
                                            </button>
                                        )}
                                    </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-3 mb-4">
                        {inventory.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-400 text-xs italic">No hay inventario registrado.</div>
                        ) : (
                            inventory.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${(item.quantity || 0) > 5 ? 'bg-green-500' : (item.quantity || 0) > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                    
                                    <div className="pl-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 mr-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1.5 rounded">{item.code}</span>
                                                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{item.category}</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.name}</h4>
                                                {activeTab === 'inventory' && (
                                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                        <Building2 size={10} /> {showInboxControls ? selectedTargetDept : (isAdmin && viewContext !== 'General' ? viewContext : currentUser.department)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`flex flex-col items-center justify-center min-w-[50px] p-1.5 rounded-lg border ${(item.quantity || 0) > 5 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Stock</span>
                                                <span className="text-lg font-bold leading-none">{item.quantity}</span>
                                            </div>
                                        </div>
                                        
                                        {activeTab === 'bodega' ? (
                                            <button 
                                                onClick={() => { setTransferItem(item); setIsTransferModalOpen(true); }}
                                                className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ArrowRightLeft size={14} /> Asignar a Área
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => { setConsumeItem(item); setIsConsumeModalOpen(true); }}
                                                className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <MinusCircle size={14} /> Registrar Consumo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Pagination 
                        currentPage={invPage}
                        totalItems={totalInventory}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setInvPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </>
            )}
          </div>
        )}

      </div>

      {/* --- MODALS (EXISTING ONES + UPDATED NEW ITEM MODAL) --- */}

      {/* ... Process Modal ... */}
      {isProcessModalOpen && processingReq && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 overflow-hidden">
                <div className={`px-5 py-4 text-white flex justify-between items-center ${
                    actionType === 'Entregada' ? 'bg-green-600' : 
                    actionType === 'Rechazada' ? 'bg-red-600' : 'bg-red-500'
                }`}>
                   <h3 className="font-bold flex items-center gap-2 text-sm">
                       {actionType === 'Entregada' && <><CheckCircle2 size={18} /> Confirmar Entrega</>}
                       {actionType === 'Rechazada' && <><X size={18} /> Rechazar Solicitud</>}
                       {actionType === 'Eliminada' && <><Trash2 size={18} /> Cancelar Solicitud</>}
                   </h3>
                   <button onClick={() => setIsProcessModalOpen(false)}><X size={18} /></button>
                </div>
                <div className="p-5 space-y-4">
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <p className="text-xs text-slate-500 mb-1">Solicitud de: <strong>{processingReq.requester_name}</strong></p>
                       <p className="font-bold text-slate-800 text-sm">{processingReq.item_name}</p>
                       <p className="text-xs text-slate-600 mt-1">Cantidad: <span className="font-bold">{processingReq.quantity}</span></p>
                   </div>
                   {actionType === 'Eliminada' ? (
                       <div className="text-center py-2">
                           <p className="text-sm text-slate-600 font-medium">¿Estás seguro de que deseas eliminar esta solicitud?</p>
                           <p className="text-xs text-slate-400 mt-1">Esta acción no se puede deshacer.</p>
                       </div>
                   ) : (
                       <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                              <MessageSquare size={12} /> Observaciones (Opcional)
                          </label>
                          <textarea 
                            value={processObservation}
                            onChange={e => setProcessObservation(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 outline-none resize-none focus:ring-2 focus:ring-blue-500"
                          />
                       </div>
                   )}
                   <div className="flex gap-3 pt-2">
                       <button onClick={() => setIsProcessModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                       <button onClick={confirmAction} className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition-colors shadow-lg ${actionType === 'Entregada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Confirmar</button>
                   </div>
                </div>
             </div>
          </div>
      )}

      {/* ... Transfer Modal ... */}
      {isTransferModalOpen && transferItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95">
                <div className="bg-slate-900 px-5 py-3 text-white rounded-t-2xl flex justify-between items-center">
                   <h3 className="font-bold flex items-center gap-2 text-sm"><ArrowRightLeft size={16} /> Asignar Stock</h3>
                   <button onClick={() => setIsTransferModalOpen(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleTransfer} className="p-5 space-y-4">
                   <div>
                      <p className="text-xs text-slate-500 mb-1">Producto</p>
                      <p className="font-bold text-slate-800">{transferItem.name}</p>
                      <p className="text-[10px] text-green-600">Disponible: {transferItem.quantity}</p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Área Destino</label>
                      <select value={transferTargetDept} onChange={e => setTransferTargetDept(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-2 outline-none" required>
                          <option value="">Seleccionar...</option>
                          {Object.values(DepartmentEnum).filter(d => d !== DepartmentEnum.HR_MATERIALS).map(d => (<option key={d} value={d}>{d}</option>))}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cantidad</label>
                      <input type="number" min="1" max={transferItem.quantity} value={transferQuantity} onChange={e => setTransferQuantity(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-2 outline-none" required />
                   </div>
                   <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-800">Confirmar</button>
                </form>
             </div>
          </div>
      )}

      {/* ... Consume Modal ... */}
      {isConsumeModalOpen && consumeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95">
                <div className="bg-red-600 px-5 py-3 text-white rounded-t-2xl flex justify-between items-center">
                   <h3 className="font-bold flex items-center gap-2 text-sm"><MinusCircle size={16} /> Registrar Consumo</h3>
                   <button onClick={() => setIsConsumeModalOpen(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleConsume} className="p-5 space-y-4">
                   <div>
                      <p className="text-xs text-slate-500 mb-1">Producto</p>
                      <p className="font-bold text-slate-800">{consumeItem.name}</p>
                      <p className="text-[10px] text-slate-500">Stock Actual: {consumeItem.quantity}</p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cantidad Consumida</label>
                      <input type="number" min="1" max={consumeItem.quantity} value={consumeQuantity} onChange={e => setConsumeQuantity(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-2 outline-none" required />
                   </div>
                   <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-red-700">Confirmar</button>
                </form>
             </div>
          </div>
      )}

      {/* MODAL: NEW REQUISITION */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="bg-blue-600 px-6 py-4 text-white rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><ShoppingCart size={18} /> Solicitud de Material</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateRequisition} className="p-6 space-y-4">
              
              {/* SELECTOR DE DESTINO - OCULTO PARA NO ADMINS (DEFAULT RRHH) */}
              {showInboxControls && (
                  <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Dirigido A</label>
                      <select 
                        value={reqTargetDept} 
                        onChange={e => setReqTargetDept(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={DepartmentEnum.HR_MATERIALS}>Recursos Materiales (Compras y Suministros)</option>
                        <option value={DepartmentEnum.DIRECTION}>Rectoría (Solicitudes Especiales)</option>
                      </select>
                  </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Producto Solicitado</label>
                <div className="relative">
                  <select 
                    value={selectedItemId} 
                    onChange={e => setSelectedItemId(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    required
                  >
                    <option value="">Seleccionar del inventario...</option>
                    {fullInventoryList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <Search size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
                
                {selectedItemForDisplay && (
                  <div className={`mt-2 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border ${
                    (selectedItemForDisplay.quantity || 0) > 0 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {(selectedItemForDisplay.quantity || 0) > 0 ? (
                      <CheckCircle2 size={14} /> 
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    Disponible en Bodega: {selectedItemForDisplay.quantity}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  value={reqQuantity} 
                  onChange={e => setReqQuantity(parseInt(e.target.value))} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Justificación Breve</label>
                <input 
                  type="text" 
                  value={reqJustification} 
                  onChange={e => setReqJustification(e.target.value)} 
                  placeholder="¿Para qué se usará?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observaciones (Opcional)</label>
                <textarea 
                  value={reqObservations} 
                  onChange={e => setReqObservations(e.target.value)} 
                  rows={2}
                  placeholder="Detalles específicos..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Enviar Solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW ITEM (UPDATED WITH AUTO-CODE) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Box size={18} /> Registrar Producto en Catálogo</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                  <select 
                    value={newItem.categoryId} 
                    onChange={e => setNewItem({...newItem, categoryId: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  >
                      <option value="">Seleccionar...</option>
                      {invCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Código (Automático)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl text-sm p-2.5 font-mono text-slate-600 font-bold text-center">
                      {previewCode}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Producto</label>
                <input type="text" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Descripción</label>
                <textarea value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-2.5 outline-none resize-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stock Inicial (Bodega)</label>
                <input type="number" value={newItem.initialStock || 0} onChange={e => setNewItem({...newItem, initialStock: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 shadow-lg transition-all" disabled={previewCode === '---'}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 text-center border border-slate-200">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 text-green-500">
                 <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Operación Exitosa</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">{successMessage}</p>
              <button onClick={() => setIsSuccessModalOpen(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">Entendido</button>
           </div>
        </div>
      )}

    </div>
  );
};
