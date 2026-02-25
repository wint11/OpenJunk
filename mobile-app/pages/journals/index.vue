<template>
	<view class="container">
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
		uni.showToast({
			title: '功能开发中',
			icon: 'none'
		});
	};

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
		transition: transform 0.2s;
		
		&:active {
			background-color: #f9f9f9;
		}
		
		.journal-content {
			flex: 1;
			margin-right: 20rpx;
			
			.journal-header {
				display: flex;
				align-items: center;
				margin-bottom: 12rpx;
				flex-wrap: wrap;
				gap: 12rpx;
				
				.journal-name {
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
					line-height: 1.4;
				}
				
				.paper-count-badge {
					background-color: #f0f2f5;
					color: #666;
					font-size: 20rpx;
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
					font-weight: 500;
				}
			}
			
			.journal-desc {
				font-size: 26rpx;
				color: #909399;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
				line-height: 1.5;
			}
		}
		
		.arrow-icon {
			color: #ccc;
			font-size: 32rpx;
			font-weight: 300;
		}
	}
	
	.loading {
		text-align: center;
		padding: 30rpx;
		color: #999;
		font-size: 24rpx;
	}
</style>
