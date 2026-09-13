export interface ContentFile {
  readonly url: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface SourceAsset extends ContentFile {
  readonly source: string;
}

export interface ModelAsset extends SourceAsset {
  readonly faces: number;
}

export interface TextureAsset {
  readonly oneX?: SourceAsset;
  readonly twoX?: SourceAsset;
}

export interface AudioAsset extends SourceAsset {
  readonly kind: 'music' | 'effect';
  readonly format: 'm4a' | 'wav';
  readonly channels: number;
  readonly sampleRate: number;
}

export interface ContentManifest {
  readonly version: 1;
  readonly data: Readonly<Record<string, ContentFile>>;
  readonly models: Readonly<Record<string, ModelAsset>>;
  readonly textures: Readonly<Record<string, TextureAsset>>;
  readonly audio: Readonly<Record<string, AudioAsset>>;
  readonly validation: Readonly<Record<string, number | string | readonly string[]>>;
}

export async function loadContentManifest(baseUrl = import.meta.env.BASE_URL): Promise<ContentManifest> {
  const response = await fetch(new URL('content/manifest.json', new URL(baseUrl, window.location.href)));
  if (!response.ok) throw new Error(`Unable to load content manifest (${response.status})`);
  const manifest = await response.json() as ContentManifest;
  if (manifest.version !== 1) throw new Error(`Unsupported content manifest version: ${String(manifest.version)}`);
  return manifest;
}

export function contentUrl(relativeUrl: string, baseUrl = import.meta.env.BASE_URL): string {
  return new URL(`content/${relativeUrl}`, new URL(baseUrl, window.location.href)).href;
}

export async function loadContentData<T>(manifest: ContentManifest, name: string, baseUrl = import.meta.env.BASE_URL): Promise<T> {
  const file = manifest.data[name];
  if (!file) throw new Error(`Unknown content data set: ${name}`);
  const response = await fetch(contentUrl(file.url, baseUrl));
  if (!response.ok) throw new Error(`Unable to load ${name} content (${response.status})`);
  return response.json() as Promise<T>;
}

export function chooseTexture(texture: TextureAsset, devicePixelRatio = window.devicePixelRatio): SourceAsset {
  const selected = devicePixelRatio > 1 ? texture.twoX ?? texture.oneX : texture.oneX ?? texture.twoX;
  if (!selected) throw new Error('Texture family contains no usable variant');
  return selected;
}

export function resolveModelAsset(manifest: ContentManifest, name: string): ModelAsset {
  const model = manifest.models[name.trim()] ?? manifest.models.Cone;
  if (!model) throw new Error(`Missing VMdl asset and Cone fallback: ${name}`);
  return model;
}

export function resolveTextureAsset(manifest: ContentManifest, name: string): TextureAsset {
  const texture = manifest.textures[name.trim()] ?? manifest.textures['White.png'];
  if (!texture) throw new Error(`Missing texture asset and White.png fallback: ${name}`);
  return texture;
}
