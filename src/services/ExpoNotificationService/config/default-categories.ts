import { IOSCategoryConfig } from '../types';

/**
 * Default iOS Notification Categories (Interactive Notifications)
 * 
 * Kullanıcıların notification'dan direkt aksiyon alabilmesi için category'ler
 */
export const DEFAULT_IOS_CATEGORIES: IOSCategoryConfig[] = [
  {
    identifier: 'MESSAGE',
    actions: [
      {
        identifier: 'REPLY',
        buttonTitle: 'Yanıtla',
        options: {
          opensAppToForeground: false,
          isForeground: false,
        },
        textInput: {
          submitButtonTitle: 'Gönder',
          placeholder: 'Mesajınızı yazın...',
        },
      },
      {
        identifier: 'VIEW',
        buttonTitle: 'Görüntüle',
        options: {
          opensAppToForeground: true,
          isForeground: true,
        },
      },
    ],
    options: {
      customDismissAction: true,
      allowInCarPlay: true,
      showTitle: true,
      showSubtitle: true,
    },
  },
  {
    identifier: 'DM_REQUEST',
    actions: [
      {
        identifier: 'ACCEPT',
        buttonTitle: 'Kabul Et',
        options: {
          opensAppToForeground: true,
          isForeground: true,
        },
      },
      {
        identifier: 'DECLINE',
        buttonTitle: 'Reddet',
        options: {
          opensAppToForeground: false,
          isForeground: false,
          isDestructive: true,
        },
      },
    ],
    options: {
      customDismissAction: true,
      allowInCarPlay: false,
      showTitle: true,
      showSubtitle: true,
    },
  },
  {
    identifier: 'POST_INTERACTION',
    actions: [
      {
        identifier: 'VIEW',
        buttonTitle: 'Görüntüle',
        options: {
          opensAppToForeground: true,
          isForeground: true,
        },
      },
      {
        identifier: 'LIKE',
        buttonTitle: 'Beğen',
        options: {
          opensAppToForeground: false,
          isForeground: false,
        },
      },
    ],
    options: {
      customDismissAction: true,
      allowInCarPlay: false,
      showTitle: true,
      showSubtitle: true,
    },
  },
];
