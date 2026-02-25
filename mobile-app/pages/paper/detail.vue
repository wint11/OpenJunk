<template>
	<view class="container">
		<!-- Loading State -->
		<view class="loading-state" v-if="loading">
			<view class="loading-spinner">↻</view>
			<text>加载中...</text>
		</view>

		<!-- Error State -->
		<view class="error-state" v-else-if="error">
			<text class="error-icon">⚠️</text>
			<text class="error-text">{{ errorMsg }}</text>
			<button class="retry-btn" @click="fetchPaperDetail">重试</button>
		</view>

		<!-- Content -->
		<view class="content" v-else-if="paper">
			<!-- Header Card -->
			<view class="card header-card">
				<view class="journal-badge" v-if="paper.journalName">
					{{ paper.journalName }}
				</view>
				<text class="title">{{ paper.title }}</text>
				<view class="author-row">
					<text class="author-icon">✍️</text>
					<text class="author-name">{{ paper.author }}</text>
				</view>
				<view class="meta-row">
					<view class="meta-item">
						<text class="meta-label">发布于</text>
						<text class="meta-value">{{ formatDate(paper.createdAt) }}</text>
					</view>
					<view class="meta-item">
						<text class="meta-label">阅读</text>
						<text class="meta-value">{{ paper.views }}</text>
					</view>
				</view>
			</view>

			<!-- Abstract Card -->
			<view class="card abstract-card" v-if="paper.description">
				<view class="section-title">摘要</view>
				<text class="abstract-text">{{ paper.description }}</text>
			</view>

			<!-- Action Area -->
			<view class="action-area">
				<button class="primary-btn" @click="downloadAndOpen" :loading="downloading" :disabled="downloading">
					<text class="btn-icon">{{ downloading ? '' : '📄' }}</text>
					<text>{{ downloading ? `下载中 ${downloadProgress}%` : '阅读全文' }}</text>
				</button>
			</view>
			
			<!-- Debug Info (Hidden in production) -->
			<!-- 
			<view class="debug-info">
				<text>PDF URL: {{ fullPdfUrl }}</text>
			</view>
			-->
		</view>
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { API, BASE_URL } from '@/common/config.js';

	const paperId = ref('');
	const paper = ref(null);
	const loading = ref(true);
	const error = ref(false);
	const errorMsg = ref('');
	
	const downloading = ref(false);
	const downloadProgress = ref(0);

	const fullPdfUrl = computed(() => {
		if (!paper.value || !paper.value.pdfUrl) return '';
		if (paper.value.pdfUrl.startsWith('http')) return paper.value.pdfUrl;
		// Handle relative paths (remove leading slash if present to avoid double slash if BASE_URL ends with slash)
		// But API.PDF_BASE usually ends with slash. Let's be safe.
		// Assuming pdfUrl is stored as 'filename.pdf' or '/filename.pdf'
		// If using API.PDF_BASE:
		// const cleanPath = paper.value.pdfUrl.startsWith('/') ? paper.value.pdfUrl.substring(1) : paper.value.pdfUrl;
		// return `${API.PDF_BASE}${cleanPath}`;
		
		// Actually, let's use BASE_URL + pdfUrl if it starts with /
		if (paper.value.pdfUrl.startsWith('/')) {
			return `${BASE_URL}${paper.value.pdfUrl}`;
		}
		return `${BASE_URL}/${paper.value.pdfUrl}`;
	});

	onLoad((options) => {
		if (options.id) {
			paperId.value = options.id;
			// Pre-fill if passed (optional, for perceived performance)
			if (options.title) {
				paper.value = {
					id: options.id,
					title: decodeURIComponent(options.title),
					author: '加载中...',
					pdfUrl: options.pdfUrl ? decodeURIComponent(options.pdfUrl) : ''
				};
			}
			fetchPaperDetail();
		} else {
			error.value = true;
			errorMsg.value = '参数错误';
			loading.value = false;
		}
	});

	const fetchPaperDetail = () => {
		loading.value = true;
		error.value = false;
		
		uni.request({
			url: `${API.PAPERS}/${paperId.value}`,
			success: (res) => {
				if (res.statusCode === 200 && res.data.data) {
					paper.value = res.data.data;
				} else {
					error.value = true;
					errorMsg.value = '获取详情失败';
				}
			},
			fail: (err) => {
				console.error(err);
				error.value = true;
				errorMsg.value = '网络请求失败';
			},
			complete: () => {
				loading.value = false;
			}
		});
	};

	const formatDate = (dateString) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	};

	const downloadAndOpen = () => {
		if (!fullPdfUrl.value) {
			uni.showToast({
				title: '暂无PDF文档',
				icon: 'none'
			});
			return;
		}

		// Navigate to internal reader
		uni.navigateTo({
			url: `/pages/paper/read?url=${encodeURIComponent(fullPdfUrl.value)}`
		});
	};
</script>

<style lang="scss">
	.container {
		padding: 30rpx;
		background-color: $uni-bg-color-grey;
		min-height: 100vh;
	}

	.loading-state, .error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 200rpx;
		
		.loading-spinner {
			font-size: 60rpx;
			color: $uni-color-primary;
			margin-bottom: 20rpx;
			animation: spin 1s linear infinite;
		}
		
		.error-icon {
			font-size: 80rpx;
			margin-bottom: 20rpx;
		}
		
		.error-text {
			color: #666;
			font-size: 28rpx;
			margin-bottom: 30rpx;
		}
		
		.retry-btn {
			background-color: $uni-color-primary;
			color: #fff;
			font-size: 28rpx;
			padding: 0 40rpx;
			height: 70rpx;
			line-height: 70rpx;
			border-radius: 35rpx;
		}
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.card {
		background-color: #fff;
		border-radius: $uni-border-radius-base;
		padding: 40rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
		margin-bottom: 30rpx;
	}

	.header-card {
		.journal-badge {
			display: inline-block;
			background-color: rgba($uni-color-primary, 0.1);
			color: $uni-color-primary;
			font-size: 24rpx;
			padding: 6rpx 16rpx;
			border-radius: 8rpx;
			margin-bottom: 24rpx;
			font-weight: 500;
		}

		.title {
			display: block;
			font-size: 40rpx;
			font-weight: 700;
			color: #1a1a1a;
			line-height: 1.4;
			margin-bottom: 30rpx;
		}

		.author-row {
			display: flex;
			align-items: center;
			margin-bottom: 30rpx;
			
			.author-icon {
				font-size: 32rpx;
				margin-right: 12rpx;
			}
			
			.author-name {
				font-size: 30rpx;
				color: #333;
				font-weight: 500;
			}
		}

		.meta-row {
			display: flex;
			border-top: 1rpx solid #eee;
			padding-top: 30rpx;
			
			.meta-item {
				margin-right: 60rpx;
				
				.meta-label {
					font-size: 24rpx;
					color: #999;
					display: block;
					margin-bottom: 8rpx;
				}
				
				.meta-value {
					font-size: 28rpx;
					color: #333;
					font-weight: 500;
				}
			}
		}
	}

	.abstract-card {
		.section-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #1a1a1a;
			margin-bottom: 24rpx;
			padding-left: 20rpx;
			border-left: 8rpx solid $uni-color-primary;
			line-height: 1;
		}
		
		.abstract-text {
			font-size: 28rpx;
			color: #555;
			line-height: 1.8;
			text-align: justify;
		}
	}

	.action-area {
		margin-top: 40rpx;
		padding-bottom: 60rpx;
		
		.primary-btn {
			background: linear-gradient(135deg, $uni-color-primary, #1c64f2);
			color: #fff;
			height: 96rpx;
			line-height: 96rpx;
			border-radius: 48rpx;
			font-size: 32rpx;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 8rpx 20rpx rgba(41, 121, 255, 0.3);
			transition: all 0.3s;
			
			&:active {
				transform: scale(0.98);
				box-shadow: 0 4rpx 10rpx rgba(41, 121, 255, 0.2);
			}

			.btn-icon {
				margin-right: 16rpx;
				font-size: 36rpx;
			}
		}
	}
</style>
