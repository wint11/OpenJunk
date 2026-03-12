<template>
	<view class="container">
		<!-- Search Bar (Placeholder) -->
		<view class="search-bar">
			<view class="search-input">
				<text class="search-icon">🔍</text>
				<text class="search-placeholder">搜索论文、期刊、小说...</text>
			</view>
		</view>

		<!-- Categories Grid -->
		<view class="category-grid">
			<view class="category-item" @click="handleCategory('journal')">
				<view class="icon-box journal-bg"><text>📚</text></view>
				<text>期刊</text>
			</view>
			<view class="category-item" @click="handleCategory('conference')">
				<view class="icon-box conf-bg"><text>🎤</text></view>
				<text>会议</text>
			</view>
			<view class="category-item" @click="handleCategory('novel')">
				<view class="icon-box novel-bg"><text>📖</text></view>
				<text>小说</text>
			</view>
			<view class="category-item" @click="handleCategory('award')">
				<view class="icon-box award-bg"><text>🏆</text></view>
				<text>奖项</text>
			</view>
		</view>

		<!-- Journals List Section -->
		<view class="section-header">
			<text class="section-title">精选期刊</text>
		</view>

		<view class="journal-list">
			<view class="journal-item" v-for="(item, index) in list" :key="index" @click="goToPapers(item)">
				<view class="journal-content">
					<view class="journal-header">
						<text class="journal-name">{{ item.name }}</text>
						<view class="paper-count-badge">
							<text>{{ item.paperCount || 0 }} 篇</text>
						</view>
					</view>
					<view class="journal-desc">{{ item.description || '暂无描述' }}</view>
				</view>
				<view class="arrow-icon">></view>
			</view>
		</view>
		
		<view class="loading" v-if="loading">加载中...</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
	import { API } from '@/common/config.js';

	const list = ref([]);
	const loading = ref(false);

	const loadData = (callback) => {
		loading.value = true;
		uni.request({
			url: API.JOURNALS,
			success: (res) => {
				if (res.statusCode === 200) {
					list.value = res.data;
				}
			},
			fail: (err) => {
				console.error(err);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			},
			complete: () => {
				loading.value = false;
				if (callback) callback();
			}
		});
	};

	const goToPapers = (item) => {
		uni.navigateTo({
			url: `/pages/paper/list?journalId=${item.id}&title=${item.name}`
		})
	};

	const handleCategory = (type) => {
		if (type === 'journal') {
			// Already here, maybe scroll down
			uni.showToast({ title: '下方查看期刊列表', icon: 'none' })
		} else {
			uni.showToast({ title: '该板块即将上线', icon: 'none' })
		}
	}

	onLoad(() => {
		loadData();
	});

	onPullDownRefresh(() => {
		loadData(() => {
			uni.stopPullDownRefresh();
		});
	});
</script>

<style lang="scss">
	.container {
		padding: 30rpx;
		background-color: #f5f7fa;
		min-height: 100vh;
	}

	.search-bar {
		margin-bottom: 30rpx;
	}

	.search-input {
		background: #fff;
		height: 80rpx;
		border-radius: 40rpx;
		display: flex;
		align-items: center;
		padding: 0 30rpx;
		color: #999;
	}
	
	.search-icon {
		margin-right: 16rpx;
	}

	.category-grid {
		display: flex;
		justify-content: space-between;
		margin-bottom: 40rpx;
		background: #fff;
		padding: 30rpx;
		border-radius: 16rpx;
	}

	.category-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 26rpx;
		color: #333;
	}

	.icon-box {
		width: 90rpx;
		height: 90rpx;
		border-radius: 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
		font-size: 40rpx;
	}

	.journal-bg { background: #e3f2fd; color: #2196f3; }
	.conf-bg { background: #f3e5f5; color: #9c27b0; }
	.novel-bg { background: #e8f5e9; color: #4caf50; }
	.award-bg { background: #fff3e0; color: #ff9800; }

	.section-header {
		margin-bottom: 20rpx;
		border-left: 8rpx solid #2979ff;
		padding-left: 20rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.journal-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}
	
	.journal-item {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03);
		
		&:active {
			background-color: #f9f9f9;
		}
		
		.journal-content {
			flex: 1;
			margin-right: 20rpx;
		}
		
		.journal-header {
			display: flex;
			align-items: center;
			margin-bottom: 12rpx;
		}
		
		.journal-name {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-right: 16rpx;
		}
		
		.paper-count-badge {
			background-color: #e3f2fd;
			padding: 4rpx 12rpx;
			border-radius: 8rpx;
			
			text {
				font-size: 20rpx;
				color: #2979ff;
			}
		}
		
		.journal-desc {
			font-size: 26rpx;
			color: #999;
			line-height: 1.4;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			overflow: hidden;
		}
		
		.arrow-icon {
			color: #ccc;
			font-size: 32rpx;
		}
	}

	.loading {
		text-align: center;
		padding: 30rpx;
		color: #999;
	}
</style>