import { TransactionData } from '../components/TransactionCard';

export const todayTransactions: TransactionData[] = [
    {
        id: '1',
        type: 'receive',
        title: 'Bahşiş Alındı',
        description: 'Mehmet Koç',
        amount: '80 TIPS',
        amountColor: '#3CA241',
        icon: 'gift',
        isDetailed: false
    }
];

export const yesterdayTransactions: TransactionData[] = [
    {
        id: '2',
        type: 'send',
        title: 'Bahşiş Gönderimi',
        description: 'Ömer Faruk Demiral',
        amount: '-50 TIPS',
        amountColor: '#A23C3C',
        icon: 'send'
    },
    {
        id: '3',
        type: 'claim',
        title: 'TIPS Claim',
        description: 'Toplu TIPS Claim Edildi.',
        amount: '370 TIPS',
        amountColor: '#3CA241',
        icon: 'gift'
    }
];

export const allTransactions = {
    today: todayTransactions,
    yesterday: yesterdayTransactions
};
