<template>
	<view class="container">
		<!-- Top Bar Removed -->

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

		<!-- Action Bar Removed as requested -->
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { API } from '@/common/config.js';

	// Constants
	const SWIPE_THRESHOLD = 50; // Lower threshold for easier swipes
	
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
		// Only render top 3 cards for performance
		return cards.value.slice(0, 3).reverse(); 
	});

	// Colors for gradient generation - Darker, richer colors for white text contrast
	const gradients = [
		'linear-gradient(135deg, #4b6cb7, #182848)', // Deep Blue
		'linear-gradient(135deg, #8E2DE2, #4A00E0)', // Deep Purple
		'linear-gradient(135deg, #00416A, #E4E5E6)', // Dark Blue to Grey (Check contrast on end) -> Replace
		'linear-gradient(135deg, #373B44, #4286f4)', // Dark Grey to Blue
		'linear-gradient(135deg, #0F2027, #203A43, #2C5364)', // Deep Teal/Space
		'linear-gradient(135deg, #C33764, #1D2671)', // Pink to Deep Blue
		'linear-gradient(135deg, #141E30, #243B55)', // Dark Slate
		'linear-gradient(135deg, #200122, #6f0000)', // Dark Red/Black
		'linear-gradient(135deg, #4568DC, #B06AB3)', // Blue Purple
		'linear-gradient(135deg, #02AAB0, #00CDAC)', // Teal (Darker end needed? Maybe ok)
	];

	// Refined gradients to ensure white text readability
	const safeGradients = [
		'linear-gradient(135deg, #1A2980, #26D0CE)', 
		'linear-gradient(135deg, #603813, #b29f94)', 
		'linear-gradient(135deg, #16222A, #3A6073)', 
		'linear-gradient(135deg, #191654, #43C6AC)',
		'linear-gradient(135deg, #43cea2, #185a9d)',
		'linear-gradient(135deg, #DA22FF, #9733EE)',
		'linear-gradient(135deg, #D4145A, #FBB03B)',
		'linear-gradient(135deg, #009245, #FCEE21)', // Might be too light at end
		'linear-gradient(135deg, #662D8C, #ED1E79)'
	];

	const getGradient = (str) => {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % safeGradients.length;
		return safeGradients[index];
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
					const newCards = res.data.data.map(item => ({
						...item,
						bgGradient: getGradient(item.title + item.id)
					}));
					
					for (let i = newCards.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						[newCards[i], newCards[j]] = [newCards[j], newCards[i]];
					}
					
					cards.value = [...cards.value, ...newCards];
					page.value++;
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

	// Card Interaction Logic
	const getCardStyle = (index) => {
		const realIndex = displayCards.value.length - 1 - index; 
		const isTop = realIndex === 0;
		
		let x = 0;
		let y = 0;
		let rotate = 0;
		let scale = 1 - (realIndex * 0.05);
		let opacity = 1;
		let zIndex = 100 - realIndex;
		
		if (isTop) {
			// Apply moveX/Y whenever it's non-zero (dragging OR animating out)
			// Only apply rotation if dragging or animating out
			if (isDragging.value || moveX.value !== 0) {
				x = moveX.value;
				y = moveY.value;
				rotate = moveX.value * 0.1;
			}
		}
		
		// Stack offset - NEGATIVE Y pushes background cards UP
		if (!isTop) {
			y = -realIndex * 30; // Visually peek from TOP
			// Add random stagger effect based on index
			// Use simple math to alternate left/right and rotation
			const staggerDir = realIndex % 2 === 0 ? 1 : -1;
			x = staggerDir * (realIndex * 10); // Offset X
			rotate = staggerDir * (realIndex * 2); // Slight rotation
		}

		return {
			transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`,
			zIndex: zIndex,
			opacity: opacity,
			// Optimize transition: instant when dragging, smooth spring when releasing
			// Use a standard ease-out for fly-away to avoid spring back visual glitch
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
		// Fly away distance - make sure it's off screen
		moveX.value = direction === 'like' ? 1000 : -1000;
		
		// Wait for animation to complete before removing card
		// 500ms matches the CSS transition duration
		setTimeout(() => {
			const topCard = cards.value[0];
			cards.value.shift();
			
			// Reset for next card
			moveX.value = 0;
			moveY.value = 0;
			
			if (direction === 'like') {
				console.log('Liked:', topCard.title);
			}
			
			if (cards.value.length < 5) {
				loadData();
			}
		}, 300); // Slightly shorter than transition to ensure smooth switch? 
        // Actually, if we wait too long, user waits. If too short, it snaps.
        // Let's try 300ms - the card will be mostly gone, then we swap. 
        // Since the next card slides into place, it shouldn't look like a snap-back.
	};
	
	const handleAction = (type) => {
		if (cards.value.length === 0) return;
		
        // Only keeping this for programmatic access if needed later, or remove entirely.
        // Since UI buttons are gone, this might not be called from template.
		if (type === 'info') {
			onCardClick(displayCards.value.length - 1); 
		} else {
			handleSwipe(type);
		}
	};

	const onCardClick = (index) => {
		const realIndex = displayCards.value.length - 1 - index;
		if (realIndex !== 0) return;
		
		const item = cards.value[0];
		uni.navigateTo({
			url: `/pages/paper/detail?id=${item.id}&title=${encodeURIComponent(item.title)}&pdfUrl=${encodeURIComponent(item.pdfUrl || '')}`
		});
	};

	const formatDate = (dateString) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
	};
	
	const toggleFilter = () => {
		uni.showToast({ title: '筛选功能开发中', icon: 'none' });
	};

	onLoad(() => {
		loadData();
	});
</script>

<style lang="scss">
	.container {
		width: 100vw;
		height: 100vh;
		background-color: #f5f7fa; 
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding-top: 40rpx; 
		box-sizing: border-box;
	}

	// .top-bar removed

	.card-stack-container {
		flex: 1;
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 0;
		margin-bottom: 0;
	}

	.card-wrapper {
		position: absolute;
		width: 96%; // Maximized width
		height: 90%; // Maximized height
		will-change: transform;
	}

	.paper-card {
		width: 100%;
		height: 100%;
		border-radius: 32rpx;
		padding: 40rpx 36rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		color: #fff;
		box-shadow: 0 16rpx 40rpx rgba(0,0,0,0.15); 
		position: relative;
		overflow: hidden;
		
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E");
			pointer-events: none;
		}
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20rpx;
		height: 50rpx; // Fixed height
		
		.journal-badge, .category-badge {
			font-size: 22rpx;
			background: rgba(255,255,255,0.25);
			padding: 6rpx 18rpx;
			border-radius: 100rpx;
			backdrop-filter: blur(4px);
			font-weight: 500;
			letter-spacing: 0.5rpx;
			box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
			max-width: 45%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.card-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden; // Contain overflow
		
		.paper-title {
			font-size: 44rpx; 
			font-weight: 700;
			line-height: 1.3;
			margin-bottom: 20rpx;
			text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
			
			// Limit to ~3 lines max
			height: 172rpx; // Strict fixed height as requested
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 3;
		}
		
		.author-row {
			display: flex;
			align-items: baseline;
			margin-bottom: 30rpx;
			height: 40rpx; // Fixed height
			
			.author-label {
				font-size: 22rpx;
				opacity: 0.8;
				margin-right: 10rpx;
				font-style: italic;
			}
			
			.author-name {
				font-size: 28rpx;
				font-weight: 500;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 80%;
			}
		}
		
		.divider {
			width: 40rpx;
			height: 4rpx;
			background: rgba(255,255,255,0.4);
			margin-bottom: 30rpx;
			border-radius: 2rpx;
			flex-shrink: 0;
		}
		
		.paper-abstract {
			font-size: 28rpx;
			line-height: 1.7;
			opacity: 0.95;
			text-align: justify;
			font-weight: 400;
			
			// Fill remaining space but handle overflow
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			// No line clamp here, just fill height
			-webkit-line-clamp: 12; 
		}
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		border-top: 1rpx solid rgba(255,255,255,0.15);
		padding-top: 24rpx;
		margin-top: 20rpx;
		height: 80rpx; // Fixed height
		flex-shrink: 0;
		
		.meta-item {
			display: flex;
			flex-direction: column;
			
			.meta-label {
				font-size: 18rpx;
				opacity: 0.7;
				text-transform: uppercase;
				letter-spacing: 1rpx;
				margin-bottom: 4rpx;
			}
			
			.meta-value {
				font-size: 24rpx;
				font-weight: 600;
			}
		}
	}

	.swipe-indicator {
		position: absolute;
		top: 60rpx;
		padding: 10rpx 20rpx;
		border: 6rpx solid;
		border-radius: 12rpx;
		font-size: 48rpx;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 4rpx;
		transform: rotate(-15deg);
		z-index: 10;
		
		&.like {
			left: 40rpx;
			color: #4cd964;
			border-color: #4cd964;
			transform: rotate(-15deg);
		}
		
		&.pass {
			right: 40rpx;
			color: #ff3b30;
			border-color: #ff3b30;
			transform: rotate(15deg);
		}
	}

	.action-bar {
		height: 140rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 50rpx;
		padding-bottom: 10rpx;
		
		.action-btn {
			width: 100rpx;
			height: 100rpx;
			border-radius: 50%;
			background: #fff;
			display: flex;
			justify-content: center;
			align-items: center;
			box-shadow: 0 8rpx 16rpx rgba(0,0,0,0.08);
			transition: all 0.2s;
			
			&:active {
				transform: scale(0.9);
				box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.05);
			}
			
			text {
				font-size: 40rpx;
			}
			
			&.pass-btn {
				color: #ff3b30;
			}
			
			&.like-btn {
				color: #4cd964;
				font-size: 50rpx;
			}
			
			&.info-btn {
				width: 80rpx;
				height: 80rpx;
				color: #007aff;
				
				text {
					font-size: 32rpx;
				}
			}
		}
	}
	
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #999;
		
		.empty-icon {
			font-size: 80rpx;
			margin-bottom: 20rpx;
		}
		
		.empty-text {
			margin-bottom: 30rpx;
			font-size: 28rpx;
		}
		
		.reload-btn {
			margin-top: 20rpx;
			background: #2979ff;
			color: #fff;
			border-radius: 100rpx;
			padding: 0 60rpx;
			font-size: 28rpx;
			box-shadow: 0 4rpx 12rpx rgba(41, 121, 255, 0.3);
		}
	}
	
	.loading-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		
		.loading-spinner {
			width: 60rpx;
			height: 60rpx;
			border: 6rpx solid rgba(0,0,0,0.1);
			border-radius: 50%;
			border-top-color: #2979ff;
			animation: spin 1s linear infinite;
		}
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
