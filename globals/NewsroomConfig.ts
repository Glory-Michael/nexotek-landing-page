import type { GlobalConfig } from 'payload';
import { revalidateTag } from 'next/cache';

export const NewsroomConfig: GlobalConfig = {
  slug: 'newsroom-config',
  label: 'Newsroom',
  admin: {
    group: 'Content',
    description:
      'Controls newsroom behaviour. Toggle demo articles to show placeholder content while the newsroom is in alpha.',
  },
  hooks: {
    afterChange: [
      async () => {
        revalidateTag('newsroom-config', 'default');
      },
    ],
  },
  fields: [
    {
      name: 'showDemoArticles',
      type: 'checkbox',
      label: 'Show demo articles',
      defaultValue: false,
      admin: {
        description:
          'When enabled, articles marked "Sample / Demo" are included in the newsroom listing and a banner is shown to visitors. Disable before launch to show only real published content.',
      },
    },
  ],
};
