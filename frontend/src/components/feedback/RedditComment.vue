<template>
  <div class="reddit-comment" :class="{ 'reddit-comment-nested': reply.parent_reply_id }">
    <div class="row no-wrap">
      <!-- Voting Section -->
      <div class="reddit-comment-vote-section">
        <div class="column items-center q-pa-xs">
          <q-btn
            flat
            dense
            round
            icon="arrow_upward"
            :color="reply.user_has_liked ? 'primary' : 'grey'"
            size="xs"
            @click="$emit('toggle-like', reply)"
            :disable="!isAuthenticated"
            class="vote-button-small"
          />
          <div class="text-caption text-weight-medium q-my-xs" :class="reply.user_has_liked ? 'text-primary' : 'text-grey-7'">
            {{ reply.like_count || 0 }}
          </div>
          <q-btn
            flat
            dense
            round
            icon="arrow_downward"
            color="grey"
            size="xs"
            :disable="true"
            class="vote-button-small"
          />
        </div>
      </div>

      <!-- Comment Content -->
      <div class="col">
        <div class="reddit-comment-content">
          <!-- Author & Metadata -->
          <div class="row items-center q-mb-xs">
            <div class="text-caption text-weight-medium">
              {{ reply.author?.full_name || reply.author?.email || 'Anonymous' }}
            </div>
            <q-chip
              v-if="reply.is_edited"
              size="xs"
              color="grey"
              text-color="white"
              class="q-ml-sm"
              dense
            >
              {{ $t('feedback.edited') || 'Edited' }}
            </q-chip>
            <q-space />
            <div class="text-caption text-grey-6">
              {{ formatDate(reply.created_at) }}
            </div>
          </div>

          <!-- Comment Text -->
          <div class="text-body2 q-mb-sm" style="white-space: pre-wrap;">{{ reply.content }}</div>

          <!-- Actions -->
          <div class="row items-center q-gutter-sm">
            <q-btn
              flat
              dense
              size="sm"
              :label="$t('feedback.reply') || 'Reply'"
              icon="reply"
              @click="showReplyForm = !showReplyForm"
              :disable="!isAuthenticated"
              color="primary"
            />
            <q-btn
              v-if="isAuthenticated && reply.user_id === currentUserId"
              flat
              dense
              size="sm"
              :label="$t('feedback.edit') || 'Edit'"
              icon="edit"
              @click="$emit('edit', reply)"
              color="grey"
            />
            <q-btn
              v-if="isAuthenticated && reply.user_id === currentUserId"
              flat
              dense
              size="sm"
              :label="$t('feedback.delete') || 'Delete'"
              icon="delete"
              @click="$emit('delete', reply.id)"
              color="negative"
            />
            <q-btn
              v-if="hasChildren"
              flat
              dense
              size="sm"
              :label="isCollapsed ? `${reply.children?.length || 0} ${$t('feedback.replies') || 'replies'}` : $t('feedback.collapse') || 'Collapse'"
              icon="expand_more"
              @click="isCollapsed = !isCollapsed"
              color="grey"
            />
          </div>

          <!-- Reply Form -->
          <q-card v-if="showReplyForm && isAuthenticated" flat bordered class="q-mt-sm q-mb-sm">
            <q-card-section class="q-pa-sm">
              <q-input
                v-model="replyContent"
                :label="$t('feedback.writeReply') || 'Write a reply...'"
                type="textarea"
                outlined
                rows="3"
                dense
                autofocus
              />
              <div class="row justify-end q-gutter-sm q-mt-sm">
                <q-btn
                  flat
                  dense
                  :label="$t('feedback.cancel') || 'Cancel'"
                  @click="showReplyForm = false; replyContent = ''"
                  color="grey"
                />
                <q-btn
                  dense
                  :label="$t('feedback.reply') || 'Reply'"
                  @click="submitReply"
                  :loading="replying"
                  :disable="!replyContent.trim()"
                  color="primary"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Nested Replies -->
          <div v-if="hasChildren && !isCollapsed" class="reddit-comment-children q-mt-sm">
            <RedditComment
              v-for="child in reply.children"
              :key="child.id"
              :reply="child"
              :current-user-id="currentUserId"
              :is-authenticated="isAuthenticated"
              @reply="handleChildReply"
              @toggle-like="handleChildLike"
              @edit="handleChildEdit"
              @delete="handleChildDelete"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';

const props = defineProps<{
  reply: any;
  currentUserId?: number;
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  (e: 'reply', replyId: number, authorName: string): void;
  (e: 'toggle-like', reply: any): void;
  (e: 'edit', reply: any): void;
  (e: 'delete', replyId: number): void;
}>();

const { t } = useI18n();

const showReplyForm = ref(false);
const replyContent = ref('');
const replying = ref(false);
const isCollapsed = ref(false);

const hasChildren = computed(() => {
  return props.reply.children && props.reply.children.length > 0;
});

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return t('feedback.dateFormats.justNow');
  if (diffMins < 60) return t('feedback.dateFormats.minutesAgo', { minutes: diffMins });
  if (diffHours < 24) return t('feedback.dateFormats.hoursAgo', { hours: diffHours });
  if (diffDays < 7) return t('feedback.dateFormats.daysAgo', { days: diffDays });
  return date.toLocaleDateString();
}

async function submitReply() {
  if (!replyContent.value.trim()) return;
  
  replying.value = true;
  try {
    await api.post(`/v1/feedback/posts/${props.reply.post_id}/replies`, {
      content: replyContent.value,
      parent_reply_id: props.reply.id
    });
    
    replyContent.value = '';
    showReplyForm.value = false;
    
    // Emit event to parent to reload post
    emit('reply', props.reply.id, props.reply.author?.full_name || props.reply.author?.email || 'Anonymous');
  } catch (err: any) {
    console.error('Failed to submit reply:', err);
  } finally {
    replying.value = false;
  }
}

function handleChildReply(replyId: number, authorName: string) {
  emit('reply', replyId, authorName);
}

function handleChildLike(reply: any) {
  emit('toggle-like', reply);
}

function handleChildEdit(reply: any) {
  emit('edit', reply);
}

function handleChildDelete(replyId: number) {
  emit('delete', replyId);
}
</script>

<style scoped>
.reddit-comment {
  margin-bottom: 8px;
}

.reddit-comment-vote-section {
  width: 32px;
  min-width: 32px;
  background-color: rgba(0, 0, 0, 0.02);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.body--dark .reddit-comment-vote-section {
  background-color: rgba(255, 255, 255, 0.02);
  border-right-color: rgba(255, 255, 255, 0.1);
}

.vote-button-small {
  min-height: 20px;
  height: 20px;
  width: 20px;
}

.reddit-comment-content {
  padding: 8px;
}

.reddit-comment-children {
  margin-left: 24px;
  border-left: 2px solid rgba(0, 0, 0, 0.1);
  padding-left: 16px;
}

.body--dark .reddit-comment-children {
  border-left-color: rgba(255, 255, 255, 0.1);
}
</style>

