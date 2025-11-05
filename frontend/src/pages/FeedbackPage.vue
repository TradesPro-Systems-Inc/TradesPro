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
          v-if="isAuthenticated"
          color="primary"
          icon="add"
          :label="$t('feedback.newPost') || 'New Post'"
          @click="showCreateDialog = true"
          unelevated
        />
      </div>
    </div>

    <!-- Filters and Search -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedCategory"
              :options="categoryOptions"
              :label="$t('feedback.category') || 'Category'"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
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
          <div class="col-12 col-md-4">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              :label="$t('feedback.sortBy') || 'Sort By'"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Posts List -->
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

    <div v-else class="q-gutter-md">
      <q-card
        v-for="post in posts"
        :key="post.id"
        clickable
        @click="viewPost(post)"
        class="feedback-post-card"
      >
        <q-card-section>
          <div class="row items-start">
            <div class="col">
              <div class="row items-center q-mb-xs">
                <q-chip
                  v-if="post.is_pinned"
                  size="sm"
                  color="amber"
                  text-color="white"
                  icon="push_pin"
                  class="q-mr-sm"
                >
                  {{ $t('feedback.pinned') || 'Pinned' }}
                </q-chip>
                <q-chip
                  :color="getCategoryColor(post.category)"
                  text-color="white"
                  size="sm"
                  class="q-mr-sm"
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
              </div>
              <div class="text-h6 q-mt-xs" :class="$q.dark.isActive ? '' : 'text-dark'">
                {{ post.title }}
              </div>
              <div class="text-body2 text-grey-7 q-mt-sm" style="max-height: 60px; overflow: hidden;">
                {{ truncateText(post.content, 150) }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="32px" color="primary" text-color="white">
                {{ getInitials(post.author?.full_name || post.author?.email || 'U') }}
              </q-avatar>
              <div>
                <div class="text-caption text-weight-medium">
                  {{ post.author?.full_name || post.author?.email || 'Anonymous' }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ formatDate(post.created_at) }}
                </div>
              </div>
            </div>
            <div class="row items-center q-gutter-md">
              <div class="text-caption text-grey-6">
                <q-icon name="visibility" size="xs" class="q-mr-xs" />
                {{ post.view_count }}
              </div>
              <div class="text-caption text-grey-6">
                <q-icon name="favorite" size="xs" class="q-mr-xs" />
                {{ post.like_count }}
              </div>
              <div class="text-caption text-grey-6">
                <q-icon name="comment" size="xs" class="q-mr-xs" />
                {{ post.reply_count }}
              </div>
            </div>
          </div>
        </q-card-section>
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
            />
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

    <!-- Post Detail Dialog -->
    <q-dialog v-model="showPostDialog" maximized>
      <q-card v-if="selectedPost">
        <q-card-section class="row items-center">
          <div class="col">
            <div class="text-h5" :class="$q.dark.isActive ? '' : 'text-dark'">
              {{ selectedPost.title }}
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              {{ $t('feedback.by') || 'By' }} {{ selectedPost.author?.full_name || selectedPost.author?.email || 'Anonymous' }}
              · {{ formatDate(selectedPost.created_at) }}
            </div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showPostDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-body1" style="white-space: pre-wrap;">{{ selectedPost.content }}</div>
          
          <div class="row items-center q-mt-md q-gutter-md">
            <q-btn
              flat
              :icon="selectedPost.user_has_liked ? 'favorite' : 'favorite_border'"
              :color="selectedPost.user_has_liked ? 'red' : 'grey'"
              :label="selectedPost.like_count"
              @click="toggleLike(selectedPost)"
              :disable="!isAuthenticated"
            />
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
        </q-card-section>

        <q-separator />

        <!-- Replies Section -->
        <q-card-section>
          <div class="text-h6 q-mb-md">
            {{ $t('feedback.replies') || 'Replies' }} ({{ selectedPost.replies?.length || 0 }})
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

          <!-- Replies List -->
          <div v-if="!selectedPost.replies || selectedPost.replies.length === 0" class="text-center q-pa-lg text-grey-6">
            {{ $t('feedback.noReplies') || 'No replies yet. Be the first to reply!' }}
          </div>

          <div v-else class="q-gutter-md">
            <q-card
              v-for="reply in selectedPost.replies"
              :key="reply.id"
              flat
              bordered
            >
              <q-card-section>
                <div class="row items-start">
                  <q-avatar size="40px" color="primary" text-color="white" class="q-mr-sm">
                    {{ getInitials(reply.author?.full_name || reply.author?.email || 'U') }}
                  </q-avatar>
                  <div class="col">
                    <div class="row items-center q-mb-xs">
                      <div class="text-weight-medium">
                        {{ reply.author?.full_name || reply.author?.email || 'Anonymous' }}
                      </div>
                      <q-chip
                        v-if="reply.is_edited"
                        size="xs"
                        color="grey"
                        text-color="white"
                        class="q-ml-sm"
                      >
                        {{ $t('feedback.edited') || 'Edited' }}
                      </q-chip>
                      <q-space />
                      <div class="text-caption text-grey-6">
                        {{ formatDate(reply.created_at) }}
                      </div>
                    </div>
                    <div class="text-body2" style="white-space: pre-wrap;">{{ reply.content }}</div>
                    <div class="row items-center q-mt-sm q-gutter-sm">
                      <q-btn
                        flat
                        dense
                        icon="favorite_border"
                        :label="reply.like_count || 0"
                        size="sm"
                        @click="toggleReplyLike(reply)"
                        :disable="!isAuthenticated"
                      />
                      <q-btn
                        v-if="isAuthenticated && reply.user_id === currentUserId"
                        flat
                        dense
                        icon="edit"
                        :label="$t('feedback.edit') || 'Edit'"
                        size="sm"
                        @click="editReply(reply)"
                      />
                      <q-btn
                        v-if="isAuthenticated && reply.user_id === currentUserId"
                        flat
                        dense
                        icon="delete"
                        :label="$t('feedback.delete') || 'Delete'"
                        size="sm"
                        color="negative"
                        @click="deleteReply(reply.id)"
                      />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import api from '../services/api';
import { useUserStore } from '../pinia-stores/user';
import { storeToRefs } from 'pinia';

const $q = useQuasar();
const userStore = useUserStore();
const { isAuthenticated, user } = storeToRefs(userStore);

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
const selectedPost = ref<any>(null);
const creating = ref(false);
const replying = ref(false);

// New post form
const newPost = ref({
  title: '',
  content: '',
  category: 'general'
});

// New reply form
const newReply = ref({
  content: ''
});

// Category options
const categoryOptions = [
  { label: 'General Discussion', value: 'general' },
  { label: 'Feature Request', value: 'feature_request' },
  { label: 'Bug Report', value: 'bug_report' },
  { label: 'Question', value: 'question' },
  { label: 'Feedback', value: 'feedback' }
];

// Sort options
const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Most Liked', value: 'most_liked' },
  { label: 'Most Replies', value: 'most_replies' }
];

// Load posts
async function loadPosts() {
  loading.value = true;
  error.value = null;
  
  try {
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value,
      sort: sortBy.value
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
    error.value = err.response?.data?.error?.message || err.message || 'Failed to load posts';
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
      message: err.response?.data?.error?.message || 'Failed to load post',
      position: 'top'
    });
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
      message: 'Post created successfully!',
      position: 'top'
    });
    showCreateDialog.value = false;
    newPost.value = { title: '', content: '', category: 'general' };
    loadPosts();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error?.message || 'Failed to create post',
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
      content: newReply.value.content
    });
    
    // Reload post to get updated replies
    await viewPost(selectedPost.value);
    newReply.value.content = '';
    
    $q.notify({
      type: 'positive',
      message: 'Reply posted!',
      position: 'top'
    });
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error?.message || 'Failed to post reply',
      position: 'top'
    });
  } finally {
    replying.value = false;
  }
}

// Toggle like
async function toggleLike(post: any) {
  if (!isAuthenticated.value) {
    $q.notify({
      type: 'info',
      message: 'Please login to like posts',
      position: 'top'
    });
    return;
  }
  
  try {
    await api.post(`/v1/feedback/posts/${post.id}/like`);
    post.user_has_liked = !post.user_has_liked;
    post.like_count += post.user_has_liked ? 1 : -1;
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error?.message || 'Failed to toggle like',
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
    reply.like_count = (reply.like_count || 0) + 1;
  } catch (err: any) {
    // Silently fail - might already be liked
  }
}

// Edit reply
function editReply(reply: any) {
  $q.dialog({
    title: 'Edit Reply',
    message: 'Update your reply:',
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
      $q.notify({
        type: 'positive',
        message: 'Reply updated',
        position: 'top'
      });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.response?.data?.error?.message || 'Failed to update reply',
        position: 'top'
      });
    }
  });
}

// Delete reply
async function deleteReply(replyId: number) {
  $q.dialog({
    title: 'Delete Reply',
    message: 'Are you sure you want to delete this reply?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/v1/feedback/replies/${replyId}`);
      if (selectedPost.value?.replies) {
        selectedPost.value.replies = selectedPost.value.replies.filter((r: any) => r.id !== replyId);
      }
      $q.notify({
        type: 'positive',
        message: 'Reply deleted',
        position: 'top'
      });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.response?.data?.error?.message || 'Failed to delete reply',
        position: 'top'
      });
    }
  });
}

// Helper functions
function getCategoryLabel(category: string): string {
  const option = categoryOptions.find(opt => opt.value === category);
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
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
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
.feedback-post-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.feedback-post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>

