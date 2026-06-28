import "server-only";

export type FacebookPagePost = {
  id: string;
  message: string | null;
  story: string | null;
  created_time: string | null;
  permalink_url: string | null;
  full_picture: string | null;
  status_type: string | null;
  attachments?: {
    data?: Array<{
      type?: string;
      title?: string;
      description?: string;
      url?: string;
      media?: { image?: { src?: string } };
      subattachments?: {
        data?: Array<{
          type?: string;
          url?: string;
          media?: { image?: { src?: string } };
        }>;
      };
    }>;
  };
};

export type FacebookMessengerProfile = {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  profile_pic?: string;
};

export type FacebookConversationMessage = {
  id?: string;
  message?: string;
  created_time?: string;
  from?: { id?: string; name?: string };
  to?: { data?: Array<{ id?: string; name?: string }> };
  attachments?: { data?: unknown[] };
};

export type FacebookPageConversation = {
  id: string;
  updated_time?: string;
  participants?: {
    data?: Array<{
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    }>;
  };
  messages?: {
    data?: FacebookConversationMessage[];
  };
};

type GraphError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type GraphPage<T> = GraphError & {
  data?: T[];
  paging?: {
    next?: string;
  };
};

export function facebookPageConfig() {
  const pageId =
    process.env.META_PAGE_ID ??
    process.env.FACEBOOK_PAGE_ID ??
    process.env.FB_PAGE_ID ??
    "";
  const pageAccessToken =
    process.env.META_PAGE_ACCESS_TOKEN ??
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ??
    process.env.FB_PAGE_ACCESS_TOKEN ??
    "";
  const graphVersion = process.env.META_GRAPH_VERSION ?? "v21.0";

  return { pageId, pageAccessToken, graphVersion };
}

export function assertFacebookPageConfig() {
  const config = facebookPageConfig();

  if (!config.pageId || !config.pageAccessToken) {
    throw new Error(
      "Facebook Page integration is not configured. Add META_PAGE_ID and META_PAGE_ACCESS_TOKEN to .env.",
    );
  }

  return config;
}

export async function facebookGraphPost<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  const { pageAccessToken, graphVersion } = assertFacebookPageConfig();
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${path}`);
  const formData = new URLSearchParams({
    ...body,
    access_token: pageAccessToken,
  });
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  const result = (await response.json()) as T & GraphError;

  if (!response.ok || result.error) {
    throw new Error(
      result.error?.message ?? "Facebook Graph API request failed.",
    );
  }

  return result;
}

export async function facebookGraphGet<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T> {
  const { pageAccessToken, graphVersion } = assertFacebookPageConfig();
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  url.searchParams.set("access_token", pageAccessToken);

  const response = await fetch(url, { cache: "no-store" });
  const result = (await response.json()) as T & GraphError;

  if (!response.ok || result.error) {
    throw new Error(
      result.error?.message ?? "Facebook Graph API request failed.",
    );
  }

  return result;
}

async function facebookGraphGetUrl<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const result = (await response.json()) as T & GraphError;

  if (!response.ok || result.error) {
    throw new Error(
      result.error?.message ?? "Facebook Graph API request failed.",
    );
  }

  return result;
}

async function collectFacebookPages<T>(
  firstPath: string,
  params: Record<string, string | number | boolean>,
  maxPages: number,
) {
  const firstPage = await facebookGraphGet<GraphPage<T>>(firstPath, params);
  const rows = [...(firstPage.data ?? [])];
  let next = firstPage.paging?.next;
  let page = 1;

  while (next && page < maxPages) {
    const result = await facebookGraphGetUrl<GraphPage<T>>(next);
    rows.push(...(result.data ?? []));
    next = result.paging?.next;
    page += 1;
  }

  return rows;
}

export async function getFacebookPagePosts(limit = 25) {
  const { pageId } = assertFacebookPageConfig();
  const result = await facebookGraphGet<{ data?: FacebookPagePost[] }>(
    `${pageId}/feed`,
    {
      limit,
      fields:
        "id,message,story,created_time,permalink_url,full_picture,status_type,attachments{media,type,url,title,description,target,subattachments}",
    },
  );

  return result.data ?? [];
}

export async function sendFacebookMessengerText(psid: string, text: string) {
  const { pageId } = assertFacebookPageConfig();

  if (!psid.trim()) throw new Error("A Messenger recipient is required.");
  if (!text.trim()) throw new Error("Message text is required.");

  return facebookGraphPost<{
    recipient_id?: string;
    message_id?: string;
  }>(`${pageId}/messages`, {
    messaging_type: "RESPONSE",
    recipient: JSON.stringify({ id: psid.trim() }),
    message: JSON.stringify({ text: text.trim() }),
  });
}

export async function getFacebookMessengerProfile(psid: string) {
  const profile = await facebookGraphGet<FacebookMessengerProfile>(psid, {
    fields: "first_name,last_name,name,profile_pic",
  });
  const displayName =
    profile.name ??
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ??
    null;

  return {
    ...profile,
    displayName: displayName || null,
  };
}

export async function getFacebookPageConversations(limit = 100, maxPages = 10) {
  const { pageId } = assertFacebookPageConfig();
  return collectFacebookPages<FacebookPageConversation>(
    `${pageId}/conversations`,
    {
      limit,
      fields: "id,updated_time,participants{id,name,email,picture}",
    },
    maxPages,
  );
}

export async function getFacebookConversationMessages(
  conversationId: string,
  limit = 100,
  maxPages = 10,
) {
  return collectFacebookPages<FacebookConversationMessage>(
    `${conversationId}/messages`,
    {
      limit,
      fields: "id,message,from,to,created_time,attachments",
    },
    maxPages,
  );
}
