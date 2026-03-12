<template>
	<view class="container">
		<!-- Card Stack -->
		<view class="card-stack-container" v-if="cards.length > 0">
			<view 
				class="card-wrapper"
				v-for="(item, index) in displayCards" 
				:key="item.id"
				:style="getCardStyle(index)"
				@touchstart="onTouchStart($event, index)"
				@touchmove="onTouchMove($event, index)"
				@touchend="onTouchEnd($event, index)"
				@click="onCardClick(index)"
			>
				<view class="paper-card" :style="{ background: item.bgGradient }">
					<!-- Card Header: Fixed Height -->
					<view class="card-header">
						<view class="journal-badge" v-if="item.journalName">
							{{ item.journalName }}
						</view>
						<view class="category-badge" v-if="item.category">
							{{ item.category }}
						</view>
					</view>

					<!-- Main Content -->
					<view class="card-content">
						<!-- Title: Fixed Height + Ellipsis -->
						<text class="paper-title">{{ item.title }}</text>
						
						<!-- Author: Fixed Height -->
						<view class="author-row">
							<text class="author-label">by</text>
							<text class="author-name">{{ item.author }}</text>
						</view>
						
						<view class="divider"></view>
						
						<!-- Abstract: Flex Fill + Ellipsis -->
						<text class="paper-abstract">{{ item.description || '暂无摘要' }}</text>
					</view>

					<!-- Footer Info: Fixed Height -->
					<view class="card-footer">
						<view class="meta-item">
							<text class="meta-label">发布于</text>
							<text class="meta-value">{{ formatDate(item.createdAt) }}</text>
						</view>
						<view class="meta-item">
							<text class="meta-label">热度</text>
							<text class="meta-value">{{ item.popularity ? item.popularity.toFixed(0) : 0 }}</text>
						</view>
					</view>
					
					<!-- Swipe Indicators -->
					<view class="swipe-indicator like" :style="{ opacity: getLikeOpacity(index) }">
						<text>INTERESTING</text>
					</view>
					<view class="swipe-indicator pass" :style="{ opacity: getPassOpacity(index) }">
						<text>PASS</text>
					</view>
				</view>
			</view>
		</view>

		<!-- Empty State -->
		<view class="empty-state" v-else-if="!loading">
			<text class="empty-icon">🎉</text>
			<text class="empty-text">所有内容已阅完</text>
			<button class="reload-btn" @click="reloadCards">重新发现</button>
		</view>

		<view class="loading-state" v-if="loading && cards.length === 0">
			<view class="loading-spinner"></view>
		</view>
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { API } from '@/common/config.js';

	// Constants
	const SWIPE_THRESHOLD = 50; 
	
	// State
	const cards = ref([]);
	const loading = ref(false);
	const page = ref(1);
	
	// Touch State
	const startX = ref(0);
	const startY = ref(0);
	const moveX = ref(0);
	const moveY = ref(0);
	const isDragging = ref(false);

	// Computed
	const displayCards = computed(() => {
		return cards.value.slice(0, 3).reverse(); 
	});

	const gradients = [
		'linear-gradient(135deg, #1A2980, #26D0CE)', 
		'linear-gradient(135deg, #603813, #b29f94)', 
		'linear-gradient(135deg, #16222A, #3A6073)', 
		'linear-gradient(135deg, #191654, #43C6AC)',
		'linear-gradient(135deg, #43cea2, #185a9d)',
		'linear-gradient(135deg, #DA22FF, #9733EE)',
		'linear-gradient(135deg, #D4145A, #FBB03B)',
		'linear-gradient(135deg, #009245, #FCEE21)',
		'linear-gradient(135deg, #662D8C, #ED1E79)'
	];

	const getGradient = (str) => {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % gradients.length;
		return gradients[index];
	};

	// Methods
	const loadData = () => {
		if (loading.value) return;
		loading.value = true;
		
		uni.request({
			url: API.PAPERS,
			data: {
				page: page.value,
				limit: 20, 
				sort: 'latest'
			},
			success: (res) => {
				if (res.statusCode === 200) {
					// Check if data format is { data: [], ... } or []
					const items = res.data.data || res.data; 
					if (Array.isArray(items)) {
						const newCards = items.map(item => ({
							...item,
							bgGradient: getGradient((item.title || '') + item.id)
						}));
						
						// Shuffle slightly to add variety if needed, or keep order
						
						cards.value = [...cards.value, ...newCards];
						page.value++;
					}
				}
			},
			complete: () => {
				loading.value = false;
			}
		});
	};

	const reloadCards = () => {
		page.value = 1;
		cards.value = [];
		loadData();
	};

	const getCardStyle = (index) => {
		const realIndex = displayCards.value.length - 1 - index; 
		const isTop = realIndex === 0;
		
		let x = 0;
		let y = 0;
		let rotate = 0;
		let scale = 1 - (realIndex * 0.05);
		let zIndex = 100 - realIndex;
		
		if (isTop) {
			if (isDragging.value || moveX.value !== 0) {
				x = moveX.value;
				y = moveY.value;
				rotate = moveX.value * 0.1;
			}
		}
		
		if (!isTop) {
			y = -realIndex * 30;
			const staggerDir = realIndex % 2 === 0 ? 1 : -1;
			x = staggerDir * (realIndex * 10);
			rotate = staggerDir * (realIndex * 2);
		}

		return {
			transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`,
			zIndex: zIndex,
			transition: isDragging.value && isTop ? 'none' : 'transform 0.5s ease-out'
		};
	};
	
	const getLikeOpacity = (index) => {
		const realIndex = displayCards.value.length - 1 - index;
		if (realIndex !== 0 || !isDragging.value) return 0;
		return moveX.value > 0 ? Math.min(moveX.value / 100, 1) : 0;
	};

	const getPassOpacity = (index) => {
		const realIndex = displayCards.value.length - 1 - index;
		if (realIndex !== 0 || !isDragging.value) return 0;
		return moveX.value < 0 ? Math.min(Math.abs(moveX.value) / 100, 1) : 0;
	};

	const onTouchStart = (e, index) => {
		const realIndex = displayCards.value.length - 1 - index;
		if (realIndex !== 0) return; 
		
		isDragging.value = true;
		startX.value = e.touches[0].clientX;
		startY.value = e.touches[0].clientY;
	};

	const onTouchMove = (e, index) => {
		const realIndex = displayCards.value.length - 1 - index;
		if (realIndex !== 0) return;
		
		moveX.value = e.touches[0].clientX - startX.value;
		moveY.value = e.touches[0].clientY - startY.value;
	};

	const onTouchEnd = (e, index) => {
		const realIndex = displayCards.value.length - 1 - index;
		if (realIndex !== 0) return;
		
		isDragging.value = false;
		
		if (Math.abs(moveX.value) > SWIPE_THRESHOLD) {
			const direction = moveX.value > 0 ? 'like' : 'pass';
			handleSwipe(direction);
		} else {
			moveX.value = 0;
			moveY.value = 0;
		}
	};
	
	const handleSwipe = (direction) => {
		const topCard = displayCards.value[displayCards.value.length - 1]; // Top card is last in displayCards
		
		// Animate off screen
		moveX.value = direction === 'like' ? 1000 : -1000;
		
		setTimeout(() => {
			// Actually remove the card from the source array
			// cards.value is [card1, card2, card3, ...]
			// displayCards is reversed slice of top 3
			// The "top" card displayed is cards.value[0]
			
			cards.value.shift();
			
			// Reset
			moveX.value = 0;
			moveY.value = 0;
			
			if (cards.value.length < 5) {
				loadData();
			}
		}, 300);
	};

	const onCardClick = (index) => {
		const realIndex = displayCards.value.length - 1 - index;
		if (realIndex !== 0) return; // Only click top card
		
		const card = cards.value[0];
		uni.navigateTo({
			url: `/pages/paper/detail?id=${card.id}`
		});
	};
	
	const formatDate = (dateStr) => {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString();
	};

	onLoad(() => {
		loadData();
	});
</script>

<style lang="scss">
	.container {
		padding: 0;
		height: 100vh;
		background-color: #f5f7fa;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.card-stack-container {
		flex: 1;
		position: relative;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding-bottom: 100rpx; // Space for bottom tabbar
	}

	.card-wrapper {
		position: absolute;
		width: 650rpx;
		height: 900rpx;
		top: 50%;
		left: 50%;
		margin-top: -500rpx; // Center vertically
		margin-left: -325rpx; // Center horizontally
	}

	.paper-card {
		width: 100%;
		height: 100%;
		border-radius: 32rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
		padding: 40rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 30rpx;
	}

	.journal-badge, .category-badge {
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		padding: 8rpx 20rpx;
		border-radius: 100rpx;
		font-size: 24rpx;
		color: #fff;
		font-weight: 500;
	}

	.card-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.paper-title {
		font-size: 44rpx;
		font-weight: 800;
		color: #fff;
		line-height: 1.3;
		margin-bottom: 20rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		overflow: hidden;
	}

	.author-row {
		display: flex;
		align-items: baseline;
		margin-bottom: 30rpx;
	}

	.author-label {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.6);
		margin-right: 12rpx;
	}

	.author-name {
		font-size: 32rpx;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
	}

	.divider {
		height: 2rpx;
		background: rgba(255, 255, 255, 0.2);
		margin-bottom: 30rpx;
	}

	.paper-abstract {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.6;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 8;
		overflow: hidden;
	}

	.card-footer {
		margin-top: auto;
		display: flex;
		justify-content: space-between;
		padding-top: 30rpx;
		border-top: 1rpx solid rgba(255, 255, 255, 0.1);
	}

	.meta-item {
		display: flex;
		flex-direction: column;
	}

	.meta-label {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: 6rpx;
	}

	.meta-value {
		font-size: 28rpx;
		color: #fff;
		font-weight: 600;
	}

	.swipe-indicator {
		position: absolute;
		top: 60rpx;
		padding: 10rpx 30rpx;
		border: 6rpx solid;
		border-radius: 12rpx;
		font-size: 40rpx;
		font-weight: bold;
		text-transform: uppercase;
		opacity: 0;
		transform: rotate(-15deg);
		z-index: 200;
		pointer-events: none;
	}

	.swipe-indicator.like {
		left: 60rpx;
		color: #4cd964;
		border-color: #4cd964;
		transform: rotate(-20deg);
	}

	.swipe-indicator.pass {
		right: 60rpx;
		color: #ff3b30;
		border-color: #ff3b30;
		transform: rotate(20deg);
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.empty-icon {
		font-size: 100rpx;
		margin-bottom: 40rpx;
	}

	.empty-text {
		font-size: 32rpx;
		color: #999;
		margin-bottom: 60rpx;
	}

	.reload-btn {
		background: #2979ff;
		color: #fff;
		border-radius: 100rpx;
		padding: 0 60rpx;
		font-size: 30rpx;
		height: 80rpx;
		line-height: 80rpx;
	}
	
	.loading-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	
	.loading-spinner {
		width: 60rpx;
		height: 60rpx;
		border: 6rpx solid #ddd;
		border-top-color: #2979ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>