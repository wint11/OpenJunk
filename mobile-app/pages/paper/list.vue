<template>
	<view class="container">
		<view class="list" v-if="list.length > 0">
			<view class="item" v-for="(item, index) in list" :key="index" @click="goToDetail(item)">
				<view class="item-title">{{ item.title }}</view>
				<view class="item-info">
					<text class="author">{{ item.author }}</text>
					<text class="date">{{ formatDate(item.createdAt) }}</text>
				</view>
				<view class="item-desc" v-if="item.description">
					{{ item.description }}
				</view>
			</view>
		</view>
		
		<view class="empty" v-else-if="!loading">
			<text>暂无相关文章</text>
		</view>
		
		<view class="loading" v-if="loading">加载中...</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
	import { API } from '@/common/config.js'

	const list = ref([])
	const loading = ref(false)
	const page = ref(1)
	const hasMore = ref(true)
	const params = ref({})

	onLoad((options) => {
		params.value = options
		if (options.title) {
			uni.setNavigationBarTitle({
				title: options.title
			})
		}
		loadData(true)
	})

	const loadData = (refresh = false) => {
		if (loading.value) return
		if (!refresh && !hasMore.value) return
		
		loading.value = true
		if (refresh) {
			page.value = 1
			hasMore.value = true
		}

		// Construct URL with params
		// Assuming API supports filtering by query params
		let url = `${API.PAPERS}?page=${page.value}&limit=10`
		if (params.value.journalId) {
			url += `&journalId=${params.value.journalId}`
		}
		// Add other filters as needed

		uni.request({
			url: url,
			success: (res) => {
				if (res.statusCode === 200) {
					const newItems = res.data.items || res.data // Adapt to API structure
					if (refresh) {
						list.value = newItems
					} else {
						list.value = [...list.value, ...newItems]
					}
					
					if (newItems.length < 10) {
						hasMore.value = false
					} else {
						page.value++
					}
				}
			},
			fail: () => {
				uni.showToast({ title: '加载失败', icon: 'none' })
			},
			complete: () => {
				loading.value = false
				if (refresh) uni.stopPullDownRefresh()
			}
		})
	}

	const goToDetail = (item) => {
		uni.navigateTo({
			url: `/pages/paper/detail?id=${item.id}`
		})
	}

	const formatDate = (dateStr) => {
		if (!dateStr) return ''
		return new Date(dateStr).toLocaleDateString()
	}

	onPullDownRefresh(() => {
		loadData(true)
	})

	onReachBottom(() => {
		loadData(false)
	})
</script>

<style lang="scss">
	.container {
		background-color: #f5f7fa;
		min-height: 100vh;
	}

	.list {
		padding: 20rpx;
	}

	.item {
		background: #fff;
		border-radius: 12rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);
	}

	.item-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 16rpx;
		line-height: 1.4;
	}

	.item-info {
		display: flex;
		justify-content: space-between;
		font-size: 24rpx;
		color: #999;
		margin-bottom: 16rpx;
	}

	.item-desc {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.empty, .loading {
		text-align: center;
		padding: 40rpx;
		color: #999;
		font-size: 28rpx;
	}
</style>