/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { AppDispatch } from '@/app/redux/store';
import { Currency, Reseller, PaymentMethod, WithdrawRequest } from '@/types/interface';
import { ProgressBar } from 'primereact/progressbar';
import withAuth from '../../authGuard';
import { useTranslation } from 'react-i18next';
import { customCellStyle } from '../../utilities/customRow';
import i18n from '@/i18n';
import { isRTL } from '../../utilities/rtlUtil';
import { Badge } from 'primereact/badge';
import { _fetchCurrencies } from '@/app/redux/actions/currenciesActions';

import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { _fetchResellers } from '@/app/redux/actions/resellerActions';
import { _fetchPaymentMethods } from '@/app/redux/actions/paymentMethodActions';
import { clearWithdrawFilters, createWithdrawRequest, fetchWithdrawRequests, setWithdrawFilters, updateWithdrawStatus } from '@/app/redux/actions/withdrawalRequestActions';

const WithdrawRequestsPage = () => {
  let emptyWithdrawRequest: Partial<WithdrawRequest> = {
    reseller_id: 0,
    currency_id: 0,
    amount: 0,
    payment_method_id: 0,
    account_name: '',
    account_number: '',
    bank_name: '',
    notes: '',
  };

  const [withdrawRequestDialog, setWithdrawRequestDialog] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [withdrawRequest, setWithdrawRequest] = useState<Partial<WithdrawRequest>>(emptyWithdrawRequest);
  const [selectedWithdrawRequests, setSelectedWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<any>>(null);
  const dispatch = useDispatch<AppDispatch>();
  
  // Get state from redux
  const { withdrawRequests, loading, pagination, filters } = useSelector(
    (state: any) => state.withdrawRequestsReducer
  );
  
  const { currencies } = useSelector((state: any) => state.currenciesReducer);
  const { resellers } = useSelector((state: any) => state.resellerReducer);
  const { paymentMethods } = useSelector((state: any) => state.paymentMethodsReducer);
  
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(fetchWithdrawRequests(1, filters));
    dispatch(_fetchCurrencies());
    dispatch(_fetchResellers());
    dispatch(_fetchPaymentMethods());
  }, [dispatch, filters]);

  useEffect(() => {
    // Apply filters when status changes
    if (statusFilter !== undefined) {
      dispatch(setWithdrawFilters({ status: statusFilter }));
    }
  }, [statusFilter, dispatch]);

  useEffect(() => {
    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].toISOString().split('T')[0];
      const endDate = dateRange[1].toISOString().split('T')[0];
      dispatch(setWithdrawFilters({ 
        start_date: startDate, 
        end_date: endDate 
      }));
    } else if (!dateRange[0] && !dateRange[1]) {
      // Clear date filters if both are null
      const { start_date, end_date, ...restFilters } = filters;
      dispatch(setWithdrawFilters(restFilters));
    }
  }, [dateRange, dispatch]);

  const openNew = () => {
    setWithdrawRequest(emptyWithdrawRequest);
    setSubmitted(false);
    setWithdrawRequestDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setWithdrawRequestDialog(false);
  };

  const hideStatusUpdateDialog = () => {
    setStatusUpdateDialog(false);
    setSelectedRequest(null);
    setAdminNote('');
  };

  const saveWithdrawRequest = () => {
    setSubmitted(true);

    // Validation
    if (!withdrawRequest.reseller_id ||
        !withdrawRequest.currency_id ||
        !withdrawRequest.amount ||
        !withdrawRequest.payment_method_id ||
        !withdrawRequest.account_name ||
        !withdrawRequest.account_number ||
        !withdrawRequest.bank_name) {
      toast.current?.show({
        severity: 'error',
        summary: t('ERROR'),
        detail: t('PLEASE_FILL_ALL_REQUIRED_FIELDS'),
        life: 3000
      });
      return;
    }

    if (withdrawRequest.amount <= 0) {
      toast.current?.show({
        severity: 'error',
        summary: t('ERROR'),
        detail: t('AMOUNT_MUST_BE_GREATER_THAN_ZERO'),
        life: 3000
      });
      return;
    }

    dispatch(createWithdrawRequest(
      withdrawRequest as any,
      toast,
      t,
      () => {
        setWithdrawRequestDialog(false);
        setWithdrawRequest(emptyWithdrawRequest);
        dispatch(fetchWithdrawRequests(1, filters));
      }
    ));
  };

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    dispatch(updateWithdrawStatus(
      selectedRequest.id,
      status,
      toast,
      t,
      adminNote,
      
      () => {
        hideStatusUpdateDialog();
        dispatch(fetchWithdrawRequests(1, filters));
      }
    ));
  };

  const confirmStatusUpdate = (request: WithdrawRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setAdminNote('');
    setStatusUpdateDialog(true);
  };

  const rightToolbarTemplate = () => {
    return (
      <React.Fragment>
        <div className="flex justify-end items-center space-x-2">
          <Button
            style={{ gap: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? '0.5rem' : '' }}
            label={t('CREATE_WITHDRAW_REQUEST')}
            icon="pi pi-plus"
            severity="success"
            className={['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'ml-2' : 'mr-2'}
            onClick={openNew}
          />
        </div>
      </React.Fragment>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            onInput={(e) => setGlobalFilter(e.currentTarget.value)}
            placeholder={t('SEARCH')}
            className="w-full"
          />
        </span>
        
        {/* <Dropdown
          value={statusFilter}
          options={[
            { label: t('ALL_STATUS'), value: '' },
            { label: t('PENDING'), value: 'pending' },
            { label: t('APPROVED'), value: 'approved' },
            { label: t('REJECTED'), value: 'rejected' }
          ]}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder={t('FILTER_BY_STATUS')}
          className="w-full md:w-14rem"
        /> */}
        
     
      </div>
    );
  };

  const resellerBodyTemplate = (rowData: WithdrawRequest) => {
    return (
      <>
        <span className="p-column-title">{t('RESELLER')}</span>
        <div className="flex align-items-center gap-2">
          {rowData.reseller?.profile_image_url && (
            <img 
              src={rowData.reseller.profile_image_url as string} 
              alt={rowData.reseller?.reseller_name || ''}
              className="w-8 h-8 rounded-circle"
            />
          )}
          <div>
            <div className="font-bold">{rowData.reseller?.reseller_name}</div>
            <small className="text-500">{rowData.reseller?.email}</small>
          </div>
        </div>
      </>
    );
  };

  const amountBodyTemplate = (rowData: WithdrawRequest) => {
    return (
      <>
        <span className="p-column-title">{t('AMOUNT')}</span>
        <div className="flex align-items-center gap-2">
          <span className={`fi fi-${rowData.currency?.code?.toLowerCase()?.substring(0, 2) || 'us'} fis`}></span>
          <span className="font-bold">
            {Number(rowData.amount).toLocaleString()} {rowData.currency?.symbol}
          </span>
        </div>
      </>
    );
  };

  const paymentMethodBodyTemplate = (rowData: WithdrawRequest) => {
    return (
      <>
        <span className="p-column-title">{t('PAYMENT_METHOD')}</span>
        <Tag
          value={rowData.payment_method?.method_name || ''}
          severity="info"
        />
      </>
    );
  };

  const bankDetailsBodyTemplate = (rowData: WithdrawRequest) => {
    return (
      <>
        <span className="p-column-title">{t('BANK_DETAILS')}</span>
        <div>
          <div><strong>{t('BANK')}:</strong> {rowData.bank_name}</div>
          <div><strong>{t('ACCOUNT_NAME')}:</strong> {rowData.account_name}</div>
          <div><strong>{t('ACCOUNT_NUMBER')}:</strong> {rowData.account_number}</div>
        </div>
      </>
    );
  };

  const statusBodyTemplate = (rowData: WithdrawRequest) => {
    const statusConfig: Record<string, { severity: string, icon: string }> = {
      0: { severity: 'warning', icon: 'pi pi-clock' },
      1: { severity: 'success', icon: 'pi pi-check' },
      2: { severity: 'danger', icon: 'pi pi-times' }
    };

    const config = statusConfig[rowData.status] || statusConfig.pending;

    return (
      <>
        <span className="p-column-title">{t('STATUS')}</span>
        <Tag
          value={t(rowData.status.toString())}
          severity={config.severity as any}
          icon={config.icon}
        />
      </>
    );
  };

  const dateBodyTemplate = (rowData: WithdrawRequest) => {
    return (
      <>
        <span className="p-column-title">{t('DATE')}</span>
        <div>
          <div><small>{new Date(rowData.created_at).toLocaleDateString()}</small></div>
          <div><small>{new Date(rowData.created_at).toLocaleTimeString()}</small></div>
        </div>
      </>
    );
  };

  const actionBodyTemplate = (rowData: WithdrawRequest) => {
    if (rowData.status !== 0) {
      return (
        <div className="flex gap-1">
          <Button
            icon="pi pi-eye"
            rounded
            severity="info"
            tooltip={t('VIEW_DETAILS')}
            tooltipOptions={{ position: 'top' }}
          />
          {rowData.admin_note && (
            <Button
              icon="pi pi-info-circle"
              rounded
              severity="help"
              tooltip={rowData.admin_note}
              tooltipOptions={{ position: 'top' }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-check"
          rounded
          severity="success"
          className="p-button-sm"
          onClick={() => confirmStatusUpdate(rowData, 'approved')}
          tooltip={t('APPROVE')}
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-times"
          rounded
          severity="danger"
          className="p-button-sm"
          onClick={() => confirmStatusUpdate(rowData, 'rejected')}
          tooltip={t('REJECT')}
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-eye"
          rounded
          severity="info"
          className="p-button-sm"
          tooltip={t('VIEW_DETAILS')}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const notesBodyTemplate = (rowData: WithdrawRequest) => {
    return (
      <>
        <span className="p-column-title">{t('NOTES')}</span>
        {rowData.notes ? (
          <div className="max-w-xs">
            <small className="text-500">{rowData.notes}</small>
          </div>
        ) : (
          <span className="text-500">-</span>
        )}
      </>
    );
  };

  const withdrawRequestDialogFooter = (
    <>
      <Button label={t('CANCEL')} icon="pi pi-times" severity="danger" className={isRTL() ? 'rtl-button' : ''} onClick={hideDialog} />
      <Button label={t('SAVE')} icon="pi pi-check" severity="success" className={isRTL() ? 'rtl-button' : ''} onClick={saveWithdrawRequest} />
    </>
  );

  const statusUpdateDialogFooter = (
    <>
      <Button label={t('CANCEL')} icon="pi pi-times" severity="secondary" onClick={hideStatusUpdateDialog} />
      <Button label={t('APPROVE')} icon="pi pi-check" severity="success" onClick={() => handleStatusUpdate('approved')} />
      <Button label={t('REJECT')} icon="pi pi-times" severity="danger" onClick={() => handleStatusUpdate('rejected')} />
    </>
  );

  const availableCurrencies = currencies.filter((currency: Currency) => currency.deleted_at === null);

  // Handle reseller change to populate account details
  const handleResellerChange = (resellerId: number) => {
    const selectedReseller = resellers.find((r: Reseller) => r.id === resellerId);
    if (selectedReseller) {
      setWithdrawRequest(prev => ({
        ...prev,
        reseller_id: resellerId,
        account_name: selectedReseller.reseller_name || selectedReseller.contact_name || ''
      }));
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (methodId: number) => {
    const selectedMethod = paymentMethods.find((m: PaymentMethod) => m.id === methodId);
    if (selectedMethod) {
      setWithdrawRequest(prev => ({
        ...prev,
        payment_method_id: methodId,
        bank_name: selectedMethod.bank_name || selectedMethod.method_name || ''
      }));
    }
  };

  return (
    <div className="grid -m-5">
      <div className="col-12">
        <div className="card p-2">
          {loading && <ProgressBar mode="indeterminate" style={{ height: '6px' }} />}
          <Toast ref={toast} />
          
          {/* <Card title={t('WITHDRAW_REQUESTS')} className="mb-4">
            <div className="grid">
              <div className="col-12 md:col-3">
                <div className="text-center p-3 border-round bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">
                    {withdrawRequests.filter((r: WithdrawRequest) => r.status === 'pending').length}
                  </div>
                  <div className="font-medium">{t('PENDING')}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="text-center p-3 border-round bg-green-50">
                  <div className="text-2xl font-bold text-green-600">
                    {withdrawRequests.filter((r: WithdrawRequest) => r.status === 'approved').length}
                  </div>
                  <div className="font-medium">{t('APPROVED')}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="text-center p-3 border-round bg-red-50">
                  <div className="text-2xl font-bold text-red-600">
                    {withdrawRequests.filter((r: WithdrawRequest) => r.status === 'rejected').length}
                  </div>
                  <div className="font-medium">{t('REJECTED')}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="text-center p-3 border-round bg-gray-50">
                  <div className="text-2xl font-bold text-gray-600">
                    {withdrawRequests.length}
                  </div>
                  <div className="font-medium">{t('TOTAL')}</div>
                </div>
              </div>
            </div>
          </Card> */}

          <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

          <DataTable
            ref={dt}
            value={withdrawRequests}
            selection={selectedWithdrawRequests}
            onSelectionChange={(e) => setSelectedWithdrawRequests(e.value as any)}
            dataKey="id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="datatable-responsive"
            paginatorTemplate={
              isRTL() ? 'RowsPerPageDropdown CurrentPageReport LastPageLink NextPageLink PageLinks PrevPageLink FirstPageLink' : 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
            }
            currentPageReportTemplate={
              isRTL()
                ? `Showing {first} to {last} of {totalRecords} entries`
                : `Showing {first} to {last} of {totalRecords} entries`
            }
            emptyMessage={t('NO_DATA_AVAILABLE')}
            dir={isRTL() ? 'rtl' : 'ltr'}
            style={{ direction: isRTL() ? 'rtl' : 'ltr', fontFamily: "'iranyekan', sans-serif,iranyekan" }}
            globalFilter={globalFilter}
            responsiveLayout="scroll"
            
          >
            <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              field="id"
              header="ID"
              sortable
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              header={t('RESELLER')}
              body={resellerBodyTemplate}
              sortable
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              header={t('AMOUNT')}
              body={amountBodyTemplate}
              sortable
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              header={t('PAYMENT_METHOD')}
              body={paymentMethodBodyTemplate}
              sortable
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              header={t('BANK_DETAILS')}
              body={bankDetailsBodyTemplate}
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              header={t('STATUS')}
              body={statusBodyTemplate}
              sortable
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              header={t('DATE')}
              body={dateBodyTemplate}
              sortable
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              header={t('NOTES')}
              body={notesBodyTemplate}
            ></Column>
            <Column
              style={{ ...customCellStyle, textAlign: ['ar', 'fa', 'ps', 'bn'].includes(i18n.language) ? 'right' : 'left' }}
              body={actionBodyTemplate}
              headerStyle={{ minWidth: '12rem' }}
              header={t('COMMON.ACTIONS')}
            ></Column>
          </DataTable>

          {/* Create Withdraw Request Dialog */}
          <Dialog
            visible={withdrawRequestDialog}
            style={{ width: '700px', padding: '5px' }}
            header={t('CREATE_WITHDRAW_REQUEST')}
            modal
            className="p-fluid"
            footer={withdrawRequestDialogFooter}
            onHide={hideDialog}
          >
            <div className="card" style={{ padding: '20px' }}>
              {/* Reseller Field */}
              <div className="field mb-4">
                <label htmlFor="reseller_id" style={{ fontWeight: 'bold' }}>
                  {t('RESELLER')} *
                </label>
                <Dropdown
                  id="reseller_id"
                  value={Number(withdrawRequest.reseller_id)}
                  options={resellers}
                  onChange={(e) => handleResellerChange(Number(e.value))}
                  optionLabel="reseller_name"
                  optionValue="id"
                  placeholder={t('SELECT_RESELLER')}
                  className={classNames({
                    'p-invalid': submitted && !withdrawRequest.reseller_id
                  })}
                  filter
                  filterBy="reseller_name,email,phone"
                  showClear
                />
                {submitted && !withdrawRequest.reseller_id && (
                  <small className="p-invalid" style={{ color: 'red' }}>
                    {t('THIS_FIELD_IS_REQUIRED')}
                  </small>
                )}
              </div>

              {/* Currency and Amount */}
              <div className="formgrid grid mb-4">
                <div className="field col">
                  <label htmlFor="currency_id" style={{ fontWeight: 'bold' }}>
                    {t('CURRENCY')} *
                  </label>
                  <Dropdown
                    id="currency_id"
                    value={Number(withdrawRequest.currency_id)}
                    options={availableCurrencies}
                    onChange={(e) => setWithdrawRequest(prev => ({
                      ...prev,
                      currency_id: Number(e.value)
                    }))}
                    optionLabel="code"
                    optionValue="id"
                    placeholder={t('SELECT_CURRENCY')}
                    className={classNames({
                      'p-invalid': submitted && !withdrawRequest.currency_id
                    })}
                  />
                  {submitted && !withdrawRequest.currency_id && (
                    <small className="p-invalid" style={{ color: 'red' }}>
                      {t('THIS_FIELD_IS_REQUIRED')}
                    </small>
                  )}
                </div>
                <div className="field col">
                  <label htmlFor="amount" style={{ fontWeight: 'bold' }}>
                    {t('AMOUNT')} *
                  </label>
                  <InputNumber
                    id="amount"
                    value={Number(withdrawRequest.amount)}
                    onValueChange={(e) => setWithdrawRequest(prev => ({
                      ...prev,
                      amount: Number(e.value) || 0
                    }))}
                    mode="decimal"
                    min={0}
                    className={classNames('w-full', {
                      'p-invalid': submitted && (!withdrawRequest.amount || withdrawRequest.amount <= 0)
                    })}
                    placeholder={t('ENTER_AMOUNT')}
                  />
                  {submitted && (!withdrawRequest.amount || withdrawRequest.amount <= 0) && (
                    <small className="p-invalid" style={{ color: 'red' }}>
                      {t('AMOUNT_MUST_BE_GREATER_THAN_ZERO')}
                    </small>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="field mb-4">
                <label htmlFor="payment_method_id" style={{ fontWeight: 'bold' }}>
                  {t('PAYMENT_METHOD')} *
                </label>
                <Dropdown
                  id="payment_method_id"
                  value={Number(withdrawRequest.payment_method_id)}
                  options={paymentMethods}
                  onChange={(e) => handlePaymentMethodChange(Number(e.value))}
                  optionLabel="method_name"
                  optionValue="id"
                  placeholder={t('SELECT_PAYMENT_METHOD')}
                  className={classNames({
                    'p-invalid': submitted && !withdrawRequest.payment_method_id
                  })}
                />
                {submitted && !withdrawRequest.payment_method_id && (
                  <small className="p-invalid" style={{ color: 'red' }}>
                    {t('THIS_FIELD_IS_REQUIRED')}
                  </small>
                )}
              </div>

              {/* Bank Details */}
              <div className="formgrid grid mb-4">
                <div className="field col">
                  <label htmlFor="bank_name" style={{ fontWeight: 'bold' }}>
                    {t('BANK_NAME')} *
                  </label>
                  <InputText
                    id="bank_name"
                    value={withdrawRequest.bank_name}
                    onChange={(e) => setWithdrawRequest(prev => ({
                      ...prev,
                      bank_name: e.target.value
                    }))}
                    className={classNames('w-full', {
                      'p-invalid': submitted && !withdrawRequest.bank_name
                    })}
                    placeholder={t('ENTER_BANK_NAME')}
                  />
                  {submitted && !withdrawRequest.bank_name && (
                    <small className="p-invalid" style={{ color: 'red' }}>
                      {t('THIS_FIELD_IS_REQUIRED')}
                    </small>
                  )}
                </div>
                <div className="field col">
                  <label htmlFor="account_name" style={{ fontWeight: 'bold' }}>
                    {t('ACCOUNT_NAME')} *
                  </label>
                  <InputText
                    id="account_name"
                    value={withdrawRequest.account_name}
                    onChange={(e) => setWithdrawRequest(prev => ({
                      ...prev,
                      account_name: e.target.value
                    }))}
                    className={classNames('w-full', {
                      'p-invalid': submitted && !withdrawRequest.account_name
                    })}
                    placeholder={t('ENTER_ACCOUNT_NAME')}
                  />
                  {submitted && !withdrawRequest.account_name && (
                    <small className="p-invalid" style={{ color: 'red' }}>
                      {t('THIS_FIELD_IS_REQUIRED')}
                    </small>
                  )}
                </div>
              </div>

              {/* Account Number */}
              <div className="field mb-4">
                <label htmlFor="account_number" style={{ fontWeight: 'bold' }}>
                  {t('ACCOUNT_NUMBER')} *
                </label>
                <InputText
                  id="account_number"
                  value={withdrawRequest.account_number}
                  onChange={(e) => setWithdrawRequest(prev => ({
                    ...prev,
                    account_number: e.target.value
                  }))}
                  className={classNames('w-full', {
                    'p-invalid': submitted && !withdrawRequest.account_number
                  })}
                  placeholder={t('ENTER_ACCOUNT_NUMBER')}
                />
                {submitted && !withdrawRequest.account_number && (
                  <small className="p-invalid" style={{ color: 'red' }}>
                    {t('THIS_FIELD_IS_REQUIRED')}
                  </small>
                )}
              </div>

              {/* Notes */}
              <div className="field mb-4">
                <label htmlFor="notes" style={{ fontWeight: 'bold' }}>
                  {t('NOTES')}
                </label>
                <textarea
                  id="notes"
                  value={withdrawRequest.notes}
                  onChange={(e:any) => setWithdrawRequest(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={3}
                  className="w-full"
                  placeholder={t('ENTER_NOTES_OPTIONAL')}
                />
              </div>
            </div>
          </Dialog>

          {/* Status Update Dialog */}
          <Dialog
            visible={statusUpdateDialog}
            style={{ width: '500px' }}
            header={t('UPDATE_WITHDRAW_STATUS')}
            modal
            footer={statusUpdateDialogFooter}
            onHide={hideStatusUpdateDialog}
          >
            <div className="flex flex-column align-items-center justify-content-center">
              <i className="pi pi-exclamation-circle mx-3" style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />
              {selectedRequest && (
                <div className="w-full">
                  <div className="mb-3">
                    <strong>{t('RESELLER')}:</strong> {selectedRequest.reseller?.reseller_name}
                  </div>
                  <div className="mb-3">
                    <strong>{t('AMOUNT')}:</strong> {Number(selectedRequest.amount).toLocaleString()} {selectedRequest.currency?.symbol}
                  </div>
                  <div className="mb-3">
                    <strong>{t('BANK_DETAILS')}:</strong> {selectedRequest.bank_name} - {selectedRequest.account_number}
                  </div>
                  
                  <div className="field w-full">
                    <label htmlFor="admin_note" className="font-bold block mb-2">
                      {t('ADMIN_NOTE')}
                    </label>
                    <textarea
                      id="admin_note"
                      value={adminNote}
                      onChange={(e:any) => setAdminNote(e.target.value)}
                      rows={3}
                      className="w-full"
                      placeholder={t('ENTER_ADMIN_NOTE_OPTIONAL')}
                    />
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default withAuth(WithdrawRequestsPage);