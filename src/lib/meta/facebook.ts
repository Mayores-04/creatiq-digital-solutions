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

type GraphError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
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
