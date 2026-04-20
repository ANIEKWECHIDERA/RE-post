'use client';

import {
  AlertCircle,
  CalendarClock,
  FileText,
  ImagePlus,
  Send,
  Sparkles,
} from 'lucide-react';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  getBrowserMediaMetadata,
  getMediaWarnings,
} from '@/features/composer/media-validation';
import { platformLabels, type Platform } from '@/schemas/platform';
import {
  createComposerPostAction,
  saveComposerDraftAction,
  type ComposerActionState,
} from '@/server/composer/actions';
import { useComposerStore } from '@/stores/composer-store';
import type { MediaMetadata } from '@/schemas/media';
import type { ComposerDraftDetail } from '@/types/drafts';

const platforms: Platform[] = ['instagram', 'facebook', 'linkedin'];

const initialState: ComposerActionState = {
  ok: false,
  message: '',
};

export function PostComposer({
  initialDraft = null,
}: {
  initialDraft?: ComposerDraftDetail | null;
}) {
  const {
    body,
    selectedPlatforms,
    scheduleMode,
    scheduledAt,
    setBody,
    togglePlatform,
    setScheduleMode,
    setScheduledAt,
    hydrateDraft,
  } = useComposerStore();
  const [publishState, publishFormAction, publishPending] = useActionState(
    createComposerPostAction,
    initialState,
  );
  const [draftState, draftFormAction, draftPending] = useActionState(
    saveComposerDraftAction,
    initialState,
  );
  const hydratedDraftId = useRef<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaMetadata[]>([]);
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );

  const derivedMediaItems = useMemo(
    () =>
      mediaItems.map(item => ({
        ...item,
        selectedPlatforms,
        warnings: getMediaWarnings(item, selectedPlatforms),
      })),
    [mediaItems, selectedPlatforms],
  );
  const allWarnings = useMemo(
    () => derivedMediaItems.flatMap(item => item.warnings),
    [derivedMediaItems],
  );
  const activeState = draftState.message ? draftState : publishState;
  const effectiveDraftId = initialDraft?.id ?? draftState.postId ?? null;
  const lastToastMessage = useRef<string | null>(null);

  useEffect(() => {
    if (!initialDraft || hydratedDraftId.current === initialDraft.id) {
      return;
    }

    hydratedDraftId.current = initialDraft.id;
    hydrateDraft({
      body: initialDraft.body,
      selectedPlatforms: initialDraft.platforms,
    });
  }, [hydrateDraft, initialDraft]);

  useEffect(() => {
    if (!activeState.message || lastToastMessage.current === activeState.message) {
      return;
    }

    lastToastMessage.current = activeState.message;

    if (activeState.ok) {
      toast.success(activeState.message);
      return;
    }

    toast.error(activeState.message);
  }, [activeState.message, activeState.ok]);

  async function handleMediaChange(files: FileList | null) {
    if (!files) {
      setMediaItems([]);
      return;
    }

    const nextItems = await Promise.all(
      Array.from(files).map(async file => {
        const metadata = await getBrowserMediaMetadata(file);
        const warnings = getMediaWarnings(metadata, selectedPlatforms);

        return {
          ...metadata,
          selectedPlatforms,
          warnings,
        };
      }),
    );

    setMediaItems(nextItems);
  }

  function handlePlatformToggle(platform: Platform) {
    togglePlatform(platform);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card className="rounded-lg shadow-soft">
        <CardHeader>
          <Badge className="w-fit rounded-md" variant="outline">
            Composer
          </Badge>
          <CardTitle className="text-3xl">Build the next post</CardTitle>
          <CardDescription>
            Draft once, validate per platform, and queue the publishing engine
            without exposing provider secrets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={publishFormAction} className="grid gap-6">
            {effectiveDraftId ? (
              <input name="draftId" type="hidden" value={effectiveDraftId} />
            ) : null}
            <input name="timezone" type="hidden" value={timezone} />
            <input
              name="mediaMetadata"
              type="hidden"
              value={JSON.stringify(derivedMediaItems)}
            />
            {selectedPlatforms.map(platform => (
              <input
                key={platform}
                name="platforms"
                type="hidden"
                value={platform}
              />
            ))}

            <div className="grid gap-2">
              <Label htmlFor="body">Post text</Label>
              <Textarea
                className="min-h-44 resize-none rounded-md"
                id="body"
                maxLength={3000}
                name="body"
                onChange={event => setBody(event.target.value)}
                placeholder="What are you making visible today?"
                required
                value={body}
              />
              <p className="text-xs text-muted-foreground">
                {body.length}/3000 characters
              </p>
            </div>

            <div className="grid gap-3">
              <Label>Platforms</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {platforms.map(platform => (
                  <label
                    className="flex items-center gap-3 rounded-lg border bg-background p-3 text-sm"
                    key={platform}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => handlePlatformToggle(platform)}
                    />
                    <span>{platformLabels[platform]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="media">Media</Label>
              {initialDraft?.mediaPreviews.length ? (
                <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Existing draft media
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {initialDraft.mediaPreviews.map(item => (
                      <div
                        aria-label="Existing draft media preview"
                        className="h-16 w-16 rounded-md border bg-cover bg-center"
                        key={item.id}
                        role="img"
                        style={
                          item.signedUrl
                            ? { backgroundImage: `url(${item.signedUrl})` }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Existing media stays attached. Add files below to attach
                    more media to this draft.
                  </p>
                </div>
              ) : null}
              <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed bg-muted/40 p-5 text-center">
                <ImagePlus className="mx-auto h-8 w-8 text-primary" />
                <span className="text-sm font-medium">
                  Upload images or videos
                </span>
                <span className="text-xs text-muted-foreground">
                  Supports JPEG, PNG, WebP, GIF, MP4, QuickTime, and WebM up to
                  100 MB.
                </span>
                <Input
                  className="sr-only"
                  id="media"
                  multiple
                  name="media"
                  onChange={event => void handleMediaChange(event.target.files)}
                  type="file"
                />
              </label>
            </div>

            <div className="grid gap-3">
              <Label>Timing</Label>
              <RadioGroup
                className="grid gap-3 sm:grid-cols-2"
                name="scheduleMode"
                onValueChange={value =>
                  setScheduleMode(value as 'now' | 'scheduled')
                }
                value={scheduleMode}
              >
                <label className="flex items-center gap-3 rounded-lg border bg-background p-3 text-sm">
                  <RadioGroupItem value="now" />
                  <span>Post now</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border bg-background p-3 text-sm">
                  <RadioGroupItem value="scheduled" />
                  <span>Schedule</span>
                </label>
              </RadioGroup>
              {scheduleMode === 'scheduled' ? (
                <Input
                  name="scheduledAt"
                  onChange={event => setScheduledAt(event.target.value)}
                  required
                  type="datetime-local"
                  value={scheduledAt ?? ''}
                />
              ) : null}
            </div>

            {activeState.message ? (
              <Alert variant={activeState.ok ? 'default' : 'destructive'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {activeState.ok ? 'Saved' : 'Needs attention'}
                </AlertTitle>
                <AlertDescription>{activeState.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-md"
                disabled={draftPending || selectedPlatforms.length === 0}
                formAction={draftFormAction}
                type="submit"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                {draftPending ? 'Saving draft...' : 'Save draft'}
              </Button>
              <Button
                className="rounded-md"
                disabled={publishPending || selectedPlatforms.length === 0}
                type="submit"
              >
                {scheduleMode === 'scheduled' ? (
                  <CalendarClock className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {publishPending
                  ? 'Saving...'
                  : scheduleMode === 'scheduled'
                    ? 'Schedule post'
                    : 'Queue post'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="grid gap-4">
        <Card className="rounded-lg shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Platform guidance
            </CardTitle>
            <CardDescription>
              Warnings are stored with media metadata for the future publishing
              engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {derivedMediaItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add media to see dimensions, aspect ratio, and platform-specific
                fit warnings.
              </p>
            ) : (
              derivedMediaItems.map(item => (
                <div className="rounded-lg border p-3" key={item.fileName}>
                  <p className="text-sm font-medium">{item.fileName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.kind} / {formatBytes(item.byteSize)}
                    {item.width && item.height
                      ? ` / ${item.width}x${item.height}`
                      : ''}
                  </p>
                </div>
              ))
            )}

            {allWarnings.length > 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Review before publishing</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 grid gap-1">
                    {allWarnings.map(warning => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
