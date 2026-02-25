
<template>
	<view class="container">
		<view class="rank-list">
			<view class="card rank-item" v-for="(item, index) in list" :key="index" @click="goToDetail(item)">
				<view class="rank-badge" :class="'rank-' + (index + 1)">
					<text class="rank-num">{{ index + 1 }}</text>
				</view>
				
				<view class="rank-content">
					<view class="paper-title">{{ item.title }}</view>
					
					<view class="rank-footer">
						<text class="author">{{ item.author }}</text>
						<view class="hot-score">
							<text class="fire-icon">🔥</text>
							<text>{{ item.popularity ? item.popularity.toFixed(0) : 0 }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<view class="loading" v-if="loading">加载中...</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
	import { API } from '@/common/config.js';

	const list = ref([]);
	const loading = ref(false);

	const loadData = (callback) => {
		loading.value = true;
		uni.request({
			url: API.TRENDS,
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

	const goToDetail = (item) => {
		uni.navigateTo({
			url: `/pages/paper/detail?id=${item.id}&title=${encodeURIComponent(item.title)}&pdfUrl=${encodeURIComponent(item.pdfUrl || '')}`
		});
	};

	onShow(() => {
		loadData();
	});

	onPullDownRefresh(() => {
		loadData(() => {
			uni.stopPullDownRefresh();
		});
	});
</script>

<style lang="scss">
	.rank-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		
		.rank-badge {
			width: 60rpx;
			height: 60rpx;
			border-radius: 50%;
			background-color: #f0f2f5;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-right: 24rpx;
			flex-shrink: 0;
			font-weight: 700;
			color: #909399;
			
			&.rank-1 { background: linear-gradient(135deg, #ffd700, #ffec8b); color: #8a6d3b; }
			&.rank-2 { background: linear-gradient(135deg, #e0e0e0, #f5f5f5); color: #757575; }
			&.rank-3 { background: linear-gradient(135deg, #cd7f32, #e6ac75); color: #8b4513; }
		}
		
		.rank-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			
			.paper-title {
				font-size: 30rpx;
				font-weight: 600;
				color: #333;
				margin-bottom: 12rpx;
				line-height: 1.4;
			}
			
			.rank-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				
				.author {
					font-size: 24rpx;
					color: #909399;
				}
				
				.hot-score {
					display: flex;
					align-items: center;
					font-size: 24rpx;
					color: #ff4d4f;
					font-weight: 600;
					
					.fire-icon {
						margin-right: 6rpx;
					}
				}
			}
		}
	}
</style>
