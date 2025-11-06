<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h4" :class="$q.dark.isActive ? '' : 'text-dark'">
          <q-icon name="forum" class="q-mr-sm" />
          {{ $t('feedback.title') || 'Feedback & Discussion' }}
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          {{ $t('feedback.subtitle') || 'Share your feedback, ask questions, and discuss features with the community' }}
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          :label="$t('feedback.newPost') || 'New Post'"
          @click="handleNewPostClick"
          unelevated
        />
      </div>
    </div>

    <!-- Filters and Search -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedCategory"
              :options="categoryOptions"
              :label="$t('feedback.category') || 'Category'"
              outlined
              dense
              emit-value
              map-options
              clearable
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              :label="$t('feedback.search') || 'Search'"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              :label="$t('feedback.sortBy') || 'Sort By'"
              outlined
              dense
              emit-value
              map-options
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Posts List - Reddit Style -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">{{ $t('feedback.loading') || 'Loading...' }}</div>
    </div>

    <div v-else-if="error" class="q-pa-md">
      <q-banner class="bg-negative text-white">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
      </q-banner>
    </div>

    <div v-else-if="posts.length === 0" class="text-center q-pa-xl">
      <q-icon name="forum" size="64px" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">
        {{ $t('feedback.noPosts') || 'No posts yet' }}
      </div>
      <div class="text-caption text-grey-6 q-mt-sm">
        {{ $t('feedback.beFirst') || 'Be the first to share your feedback!' }}
      </div>
    </div>

    <!-- Reddit-style Post Cards -->
    <div v-else class="q-gutter-sm">
      <q-card
        v-for="post in posts"
        :key="post.id"
        class="reddit-post-card"
        flat
        bordered
        @click="viewPost(post)"
      >
        <div class="row no-wrap">
          <!-- Voting Section (Left) -->
          <div class="reddit-vote-section">
            <div class="column items-center q-pa-sm">
              <q-btn
                flat
                dense
                round
                :icon="post.user_has_liked ? 'arrow_upward' : 'arrow_upward'"
                :color="post.user_has_liked ? 'primary' : 'grey'"
                size="sm"
                @click.stop="toggleLike(post)"
                :disable="!isAuthenticated"
                class="vote-button"
              />
              <div class="text-caption text-weight-medium q-my-xs" :class="post.user_has_liked ? 'text-primary' : 'text-grey-7'">
                {{ post.like_count || 0 }}
              </div>
              <q-btn
                flat
                dense
                round
                icon="arrow_downward"
                color="grey"
                size="sm"
                @click.stop=""
                :disable="true"
                class="vote-button"
              />
            </div>
          </div>

          <!-- Content Section (Right) -->
          <div class="col">
            <q-card-section class="q-pa-sm">
              <!-- Header: Category, Pinned, Resolved -->
              <div class="row items-center q-mb-xs">
                <q-chip
                  v-if="post.is_pinned"
                  size="sm"
                  color="amber"
                  text-color="white"
                  icon="push_pin"
                  class="q-mr-xs"
                >
                  {{ $t('feedback.pinned') || 'Pinned' }}
                </q-chip>
                <q-chip
                  :color="getCategoryColor(post.category)"
                  text-color="white"
                  size="sm"
                  class="q-mr-xs"
                >
                  {{ getCategoryLabel(post.category) }}
                </q-chip>
                <q-chip
                  v-if="post.is_resolved"
                  size="sm"
                  color="positive"
                  text-color="white"
                  icon="check_circle"
                >
                  {{ $t('feedback.resolved') || 'Resolved' }}
                </q-chip>
                <q-space />
                <div class="text-caption text-grey-6">
                  {{ formatDate(post.created_at) }}
                </div>
              </div>

              <!-- Title -->
              <div class="text-h6 q-mt-xs cursor-pointer" :class="$q.dark.isActive ? '' : 'text-dark'">
                {{ post.title }}
              </div>

              <!-- Content Preview -->
              <div class="text-body2 text-grey-7 q-mt-sm" style="max-height: 80px; overflow: hidden;">
                {{ truncateText(post.content, 200) }}
              </div>

              <!-- Footer: Author, Stats -->
              <div class="row items-center justify-between q-mt-sm">
                <div class="row items-center q-gutter-sm">
                  <q-avatar size="24px" color="primary" text-color="white">
                    {{ getInitials(post.author?.full_name || post.author?.email || 'U') }}
                  </q-avatar>
                  <div class="text-caption text-grey-7">
                    {{ post.author?.full_name || post.author?.email || 'Anonymous' }}
                  </div>
                </div>
                <div class="row items-center q-gutter-md">
                  <div class="text-caption text-grey-6">
                    <q-icon name="comment" size="xs" class="q-mr-xs" />
                    {{ post.reply_count }} {{ post.reply_count === 1 ? $t('feedback.comment') || 'comment' : $t('feedback.comments') || 'comments' }}
                  </div>
                  <div class="text-caption text-grey-6">
                    <q-icon name="visibility" size="xs" class="q-mr-xs" />
                    {{ post.view_count }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </div>
        </div>
      </q-card>
    </div>

    <!-- Pagination -->
    <div v-if="posts.length > 0" class="row justify-center q-mt-lg">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="7"
        direction-links
        boundary-links
        @update:model-value="loadPosts"
      />
    </div>

    <!-- Login Dialog -->
    <LoginDialog
      v-model="showLoginDialog"
      @login-success="handleLoginSuccess"
    />

    <!-- Create Post Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 500px; max-width: 800px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ $t('feedback.newPost') || 'Create New Post' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="createPost">
            <q-select
              v-model="newPost.category"
              :options="categoryOptions"
              :label="$t('feedback.category') || 'Category'"
              outlined
              emit-value
              map-options
              :rules="[val => !!val || $t('feedback.categoryRequired') || 'Category is required']"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-input
              v-model="newPost.title"
              :label="$t('feedback.title') || 'Title'"
              outlined
              class="q-mt-md"
              :rules="[val => !!val || $t('feedback.titleRequired') || 'Title is required']"
            />
            <q-input
              v-model="newPost.content"
              :label="$t('feedback.content') || 'Content'"
              type="textarea"
              outlined
              rows="8"
              class="q-mt-md"
              :rules="[val => !!val || $t('feedback.contentRequired') || 'Content is required']"
            />
            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn
                flat
                :label="$t('feedback.cancel') || 'Cancel'"
                v-close-popup
              />
              <q-btn
                type="submit"
                color="primary"
                :label="$t('feedback.create') || 'Create'"
                :loading="creating"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Post Detail Dialog - Reddit Style -->
    <q-dialog v-model="showPostDialog" maximized>
      <q-card v-if="selectedPost" class="full-height">
        <q-card-section class="row items-center q-pb-sm">
          <div class="col">
            <div class="text-h5 q-mb-xs" :class="$q.dark.isActive ? '' : 'text-dark'">
              {{ selectedPost.title }}
            </div>
            <div class="text-caption text-grey-6">
              <span>{{ $t('feedback.by') || 'By' }} {{ selectedPost.author?.full_name || selectedPost.author?.email || 'Anonymous' }}</span>
              <span class="q-mx-sm">·</span>
              <span>{{ formatDate(selectedPost.created_at) }}</span>
            </div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showPostDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <!-- Post Content -->
          <div class="row no-wrap">
            <!-- Voting Section -->
            <div class="reddit-vote-section">
              <div class="column items-center q-pa-sm">
                <q-btn
                  flat
                  dense
                  round
                  :icon="selectedPost.user_has_liked ? 'arrow_upward' : 'arrow_upward'"
                  :color="selectedPost.user_has_liked ? 'primary' : 'grey'"
                  size="md"
                  @click="toggleLike(selectedPost)"
                  :disable="!isAuthenticated"
                />
                <div class="text-body1 text-weight-medium q-my-xs" :class="selectedPost.user_has_liked ? 'text-primary' : 'text-grey-7'">
                  {{ selectedPost.like_count || 0 }}
                </div>
                <q-btn
                  flat
                  dense
                  round
                  icon="arrow_downward"
                  color="grey"
                  size="md"
                  :disable="true"
                />
              </div>
            </div>

            <!-- Post Content -->
            <div class="col">
              <div class="text-body1" style="white-space: pre-wrap;">{{ selectedPost.content }}</div>
              
              <div class="row items-center q-mt-md q-gutter-sm">
                <q-chip
                  :color="getCategoryColor(selectedPost.category)"
                  text-color="white"
                >
                  {{ getCategoryLabel(selectedPost.category) }}
                </q-chip>
                <q-chip v-if="selectedPost.is_resolved" color="positive" text-color="white" icon="check_circle">
                  {{ $t('feedback.resolved') || 'Resolved' }}
                </q-chip>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Comments Section -->
        <q-card-section class="q-pa-md">
          <div class="text-h6 q-mb-md">
            {{ $t('feedback.replies') || 'Replies' }} ({{ selectedPost.reply_count || 0 }})
          </div>

          <!-- Reply Form -->
          <q-card v-if="isAuthenticated" flat bordered class="q-mb-md">
            <q-card-section>
              <q-input
                v-model="newReply.content"
                :label="$t('feedback.writeReply') || 'Write a reply...'"
                type="textarea"
                outlined
                rows="3"
                autofocus
              />
              <div class="row justify-end q-mt-sm">
                <q-btn
                  color="primary"
                  :label="$t('feedback.reply') || 'Reply'"
                  @click="submitReply"
                  :loading="replying"
                  :disable="!newReply.content.trim()"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Comments List - Nested Tree -->
          <div v-if="!selectedPost.replies || selectedPost.replies.length === 0" class="text-center q-pa-lg text-grey-6">
            {{ $t('feedback.noReplies') || 'No replies yet. Be the first to reply!' }}
          </div>

          <!-- Render nested comments tree -->
          <div v-else class="reddit-comments-tree">
            <RedditComment
              v-for="reply in topLevelReplies"
              :key="reply.id"
              :reply="reply"
              :current-user-id="currentUserId"
              :is-authenticated="isAuthenticated"
              @reply="handleReply"
              @toggle-like="toggleReplyLike"
              @edit="editReply"
              @delete="deleteReply"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { useUserStore } from '../pinia-stores/user';
import { storeToRefs } from 'pinia';
import RedditComment from '../components/feedback/RedditComment.vue';
import LoginDialog from '../components/auth/LoginDialog.vue';

const $q = useQuasar();
const userStore = useUserStore();
const { isAuthenticated, user } = storeToRefs(userStore);
const { t } = useI18n();

const currentUserId = computed(() => user.value?.id);

// State
const posts = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);
const selectedCategory = ref<string | null>(null);
const searchQuery = ref('');
const sortBy = ref('newest');
const showCreateDialog = ref(false);
const showPostDialog = ref(false);
const showLoginDialog = ref(false);
const selectedPost = ref<any>(null);
const creating = ref(false);
const replying = ref(false);
const pendingAction = ref<'create-post' | null>(null);

// New post form
const newPost = ref({
  title: '',
  content: '',
  category: 'general'
});

// New reply form
const newReply = ref({
  content: '',
  parentReplyId: null as number | null
});

// Category options - use i18n
const categoryOptions = computed(() => [
  { label: t('feedback.categories.general'), value: 'general' },
  { label: t('feedback.categories.feature_request'), value: 'feature_request' },
  { label: t('feedback.categories.bug_report'), value: 'bug_report' },
  { label: t('feedback.categories.question'), value: 'question' },
  { label: t('feedback.categories.feedback'), value: 'feedback' }
]);

// Sort options - Reddit style
const sortOptions = computed(() => [
  { label: t('feedback.sortOptions.hot') || 'Hot', value: 'hot' },
  { label: t('feedback.sortOptions.newest'), value: 'newest' },
  { label: t('feedback.sortOptions.most_liked'), value: 'most_liked' },
  { label: t('feedback.sortOptions.most_replies'), value: 'most_replies' },
  { label: t('feedback.sortOptions.controversial') || 'Controversial', value: 'controversial' }
]);

// Build nested replies tree
const topLevelReplies = computed(() => {
  if (!selectedPost.value?.replies || selectedPost.value.replies.length === 0) return [];
  
  const replies = selectedPost.value.replies;
  const replyMap = new Map();
  const rootReplies: any[] = [];

  // First pass: create map of all replies with children array
  replies.forEach((reply: any) => {
    replyMap.set(reply.id, { ...reply, children: [] });
  });

  // Second pass: build tree
  replies.forEach((reply: any) => {
    const replyNode = replyMap.get(reply.id);
    if (reply.parent_reply_id) {
      const parent = replyMap.get(reply.parent_reply_id);
      if (parent) {
        parent.children.push(replyNode);
      }
    } else {
      rootReplies.push(replyNode);
    }
  });

  return rootReplies;
});

// Load posts
async function loadPosts() {
  loading.value = true;
  error.value = null;
  
  try {
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value,
      sort: sortBy.value === 'hot' ? 'most_liked' : sortBy.value // Map 'hot' to 'most_liked'
    };
    
    if (selectedCategory.value) {
      params.category = selectedCategory.value;
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    
    const response = await api.get('/v1/feedback/posts', { params });
    posts.value = response.data.items;
    totalPages.value = response.data.total_pages;
  } catch (err: any) {
    console.error('Error loading posts:', err);
    error.value = err.response?.data?.error?.message || err.message || t('feedback.postsLoadFailed');
    $q.notify({
      type: 'negative',
      message: error.value,
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
}

// View post detail
async function viewPost(post: any) {
  try {
    const response = await api.get(`/v1/feedback/posts/${post.id}`);
    selectedPost.value = response.data;
    showPostDialog.value = true;
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error?.message || t('feedback.postLoadFailed'),
      position: 'top'
    });
  }
}

// Handle new post click
function handleNewPostClick() {
  if (!isAuthenticated.value) {
    pendingAction.value = 'create-post';
    showLoginDialog.value = true;
    return;
  }
  showCreateDialog.value = true;
}

// Handle login success
function handleLoginSuccess() {
  if (pendingAction.value === 'create-post') {
    showCreateDialog.value = true;
    pendingAction.value = null;
  }
}

// Create post
async function createPost() {
  if (!newPost.value.title || !newPost.value.content || !newPost.value.category) {
    return;
  }
  
  creating.value = true;
  try {
    const response = await api.post('/v1/feedback/posts', newPost.value);
    $q.notify({
      type: 'positive',
      message: t('feedback.postCreated'),
      position: 'top'
    });
    showCreateDialog.value = false;
    newPost.value = { title: '', content: '', category: 'general' };
    loadPosts();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error?.message || t('feedback.postCreateFailed'),
      position: 'top'
    });
  } finally {
    creating.value = false;
  }
}

// Submit reply
async function submitReply() {
  if (!selectedPost.value || !newReply.value.content.trim()) {
    return;
  }
  
  replying.value = true;
  try {
    const response = await api.post(`/v1/feedback/posts/${selectedPost.value.id}/replies`, {
      content: newReply.value.content,
      parent_reply_id: newReply.value.parentReplyId
    });
    
    // Reload post to get updated replies
    await viewPost(selectedPost.value);
    newReply.value.content = '';
    newReply.value.parentReplyId = null;
    
    $q.notify({
      type: 'positive',
      message: t('feedback.replyPosted'),
      position: 'top'
    });
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error?.message || t('feedback.replyPostFailed'),
      position: 'top'
    });
  } finally {
    replying.value = false;
  }
}

// Handle reply to comment (reload post to get updated tree)
async function handleReply(replyId: number, authorName: string) {
  // Reload post to get updated replies tree
  if (selectedPost.value) {
    await viewPost(selectedPost.value);
  }
}

// Toggle like
async function toggleLike(post: any) {
  if (!isAuthenticated.value) {
    showLoginDialog.value = true;
    return;
  }
  
  try {
    await api.post(`/v1/feedback/posts/${post.id}/like`);
    post.user_has_liked = !post.user_has_liked;
    post.like_count += post.user_has_liked ? 1 : -1;
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error?.message || t('feedback.toggleLikeFailed'),
      position: 'top'
    });
  }
}

// Toggle reply like
async function toggleReplyLike(reply: any) {
  if (!isAuthenticated.value) {
    return;
  }
  
  try {
    await api.post(`/v1/feedback/replies/${reply.id}/like`);
    reply.user_has_liked = !reply.user_has_liked;
    reply.like_count = (reply.like_count || 0) + (reply.user_has_liked ? 1 : -1);
    
    // Reload post to ensure consistency
    if (selectedPost.value) {
      await viewPost(selectedPost.value);
    }
  } catch (err: any) {
    console.error('Failed to toggle reply like:', err);
  }
}

// Edit reply
async function editReply(reply: any) {
  $q.dialog({
    title: t('feedback.editReply'),
    message: t('feedback.updateReply'),
    prompt: {
      model: reply.content,
      type: 'textarea',
      rows: 5
    },
    cancel: true,
    persistent: true
  }).onOk(async (content: string) => {
    try {
      await api.put(`/v1/feedback/replies/${reply.id}`, { content });
      reply.content = content;
      reply.is_edited = true;
      
      // Reload post to ensure consistency
      if (selectedPost.value) {
        await viewPost(selectedPost.value);
      }
      
      $q.notify({
        type: 'positive',
        message: t('feedback.replyUpdated'),
        position: 'top'
      });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.response?.data?.error?.message || t('feedback.replyUpdateFailed'),
        position: 'top'
      });
    }
  });
}

// Delete reply
async function deleteReply(replyId: number) {
  $q.dialog({
    title: t('feedback.deleteReply'),
    message: t('feedback.deleteReplyConfirm'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/v1/feedback/replies/${replyId}`);
      if (selectedPost.value?.replies) {
        selectedPost.value.replies = selectedPost.value.replies.filter((r: any) => r.id !== replyId);
        selectedPost.value.reply_count -= 1;
      }
      $q.notify({
        type: 'positive',
        message: t('feedback.replyDeleted'),
        position: 'top'
      });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.response?.data?.error?.message || t('feedback.replyDeleteFailed'),
        position: 'top'
      });
    }
  });
}

// Helper functions
function getCategoryLabel(category: string): string {
  const option = categoryOptions.value.find(opt => opt.value === category);
  return option?.label || category;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    general: 'blue',
    feature_request: 'green',
    bug_report: 'red',
    question: 'orange',
    feedback: 'purple'
  };
  return colors[category] || 'grey';
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

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

// Watchers
watch([selectedCategory, searchQuery, sortBy], () => {
  currentPage.value = 1;
  loadPosts();
});

// Load posts on mount
onMounted(() => {
  loadPosts();
});
</script>

<style scoped>
.reddit-post-card {
  transition: transform 0.1s, box-shadow 0.1s;
  cursor: pointer;
}

.reddit-post-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reddit-vote-section {
  width: 40px;
  min-width: 40px;
  background-color: rgba(0, 0, 0, 0.02);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.body--dark .reddit-vote-section {
  background-color: rgba(255, 255, 255, 0.02);
  border-right-color: rgba(255, 255, 255, 0.1);
}

.vote-button {
  min-height: 24px;
  height: 24px;
  width: 24px;
}

.reddit-comments-tree {
  max-width: 100%;
}
</style>
