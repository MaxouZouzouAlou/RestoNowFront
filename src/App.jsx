import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, MapPin, Phone, Clock, ExternalLink, ChevronLeft, ChevronRight, Star, Heart, X, ChevronDown } from 'lucide-react';

const generateMockData = async (latitude, longitude) => {
	const url = 'http://localhost:49161/api/users/postUserPositionForRestaurants';
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ latitude, longitude })
		});
		if (!response.ok) throw new Error('Network response was not ok');
		const data = await response.json();
		return data.places;
	} catch (error) {
		console.error('Failed to fetch data:', error);
		return [];
	}
};

const getCurrentPosition = () => {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported'));
		} else {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					resolve({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude
					});
				},
				(err) => reject(err)
			);
		}
	});
};

const ImageCarousel = ({ images, title }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const imageList = Array.isArray(images) && images.length > 0
		? images
		: images
			? [images]
			: [null];

	const nextImage = (e) => {
		e.stopPropagation();
		setCurrentIndex((prev) => (prev + 1) % imageList.length);
	};

	const prevImage = (e) => {
		e.stopPropagation();
		setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
	};

	return (
		<div className="relative h-48 bg-gray-100 overflow-hidden group rounded-lg">
			{imageList[currentIndex] ? (
				<img
					src={imageList[currentIndex]}
					alt={title}
					className="w-full h-full object-cover"
					onError={(e) => {
						e.target.style.display = 'none';
						e.target.parentElement.innerHTML = `<div class="absolute inset-0 flex items-center justify-center bg-gray-100"><div class="text-gray-300 text-5xl font-bold">${title.charAt(0)}</div></div>`;
					}}
				/>
			) : (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-gray-300 text-5xl font-bold">{title.charAt(0)}</div>
				</div>
			)}
			
			{imageList.length > 1 && (
				<>
					<button
						onClick={prevImage}
						className="absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
					>
						<ChevronLeft size={18} />
					</button>
					<button
						onClick={nextImage}
						className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
					>
						<ChevronRight size={18} />
					</button>
					<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
						{imageList.map((_, idx) => (
							<div
								key={idx}
								className={`h-1 rounded-full transition-all ${
									idx === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/60'
								}`}
							></div>
						))}
					</div>
				</>
			)}
		</div>
	);
};

function App() {
	const [places, setPlaces] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedType, setSelectedType] = useState('All');
	const [statusFilter, setStatusFilter] = useState('Tous');
	const [loading, setLoading] = useState(true);
	const [favorites, setFavorites] = useState(new Set());
	const effectCalled = useRef(false);

	const [selectedCategory, setSelectedCategory] = useState('restaurants');
	const [coords, setCoords] = useState(null);

	const MAX_VISIBLE_TYPES = 6;
	const [showAllTypes, setShowAllTypes] = useState(false);
	
	// Distance filter (in km)
	const [maxDistance, setMaxDistance] = useState(10); // default 10km
	// Set window title
	useEffect(() => {
		document.title = 'RestoNow';
	}, []);
	// Dynamic step based on distance range
	const getDistanceStep = (distance) => {
		if (distance <= 2) return 0.1;
		if (distance <= 5) return 0.5;
		if (distance <= 10) return 1;
		return 2;
	};
	
	const getDistanceMax = () => 50;
	
	const handleDistanceChange = (value) => {
		const step = getDistanceStep(value);
		const rounded = Math.round(value / step) * step;
		setMaxDistance(rounded);
	};

	useEffect(() => {
		getCurrentPosition()
			.then(pos => {
				setCoords(pos);
			})
			.catch(err => {
				console.log('Geolocation error:', err);
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		if (!coords) return;
		setLoading(true);
		const url =
			selectedCategory === 'bars'
				? 'http://localhost:49161/api/users/postUserPositionForBars'
				: 'http://localhost:49161/api/users/postUserPositionForRestaurants';
		fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude })
		})
			.then(response => {
				if (!response.ok) throw new Error('Network response was not ok');
				return response.json();
			})
			.then(data => {
				setPlaces(data.places);
				setLoading(false);
			})
			.catch(err => {
				console.log('API error:', err);
				setLoading(false);
			});
	}, [selectedCategory, coords]);

	const types = useMemo(() => ['All', ...Array.from(new Set(places.map(p => p.type)))], [places]);
	const statusOptions = ['Tous', 'Ouvert', 'Fermé'];

	// Emoji mapping for types
	const typeEmojis = {
		'All': '🍽️',
		'Restaurants': '🍽️',
		'Bars': '🍺',
		'Pizza': '🍕',
		'Burger': '🍔',
		'Sushi': '🍣',
		'Asian': '🥢',
		'Italian': '🍝',
		'French': '🥖',
		'Mexican': '🌮',
		'Indian': '🍛',
		'Chinese': '🥡',
		'Japanese': '🍱',
		'Thai': '🍜',
		'Fast food': '🍟',
		'Bakery': '🥐',
		'Cafe': '☕',
		'Dessert': '🍰',
		'Seafood': '🦞',
		'Steakhouse': '🥩',
		'Vegetarian': '🥗',
		'Vegan': '🌱',
		'BBQ': '🍖',
		'Mediterranean': '🫒',
		'American': '🍔',
		'Korean': '🍜',
		'Vietnamese': '🍲',
		'Lebanese': '🥙',
		'Turkish': '🥙',
		'Greek': '🫒',
		'Spanish': '🥘',
		'Tapas': '🍤',
		'Wine bar': '🍷',
		'Cocktail bar': '🍸',
		'Pub': '🍺',
		'Brewery': '🍻'
	};

	const getEmojiForType = (type) => {
		return typeEmojis[type] || '🍴';
	};

	const filteredPlaces = useMemo(() => {
		return places.filter(place => {
			const title = place.title ? place.title.toLowerCase() : '';
			const address = place.address ? place.address.toLowerCase() : '';
			const matchesSearch = title.includes(searchTerm.toLowerCase()) ||
				address.includes(searchTerm.toLowerCase());
			const matchesType = selectedType === 'All' || place.type === selectedType;
			let matchesStatus = true;
			if (statusFilter === 'Ouvert') {
				matchesStatus = place.info === 'Ouvert';
			} else if (statusFilter === 'Fermé') {
				matchesStatus = place.info === 'Fermé';
			}
			const isClosedToday = place.info === "Fermé aujourd'hui";
			
			// Distance filter
			const matchesDistance = place.distance_from_user ? place.distance_from_user <= maxDistance : true;
			
			return matchesSearch && matchesType && matchesStatus && !isClosedToday && matchesDistance;
		});
	}, [places, searchTerm, selectedType, statusFilter, maxDistance]);

	const toggleFavorite = (index) => {
		setFavorites(prev => {
			const newFavorites = new Set(prev);
			if (newFavorites.has(index)) {
				newFavorites.delete(index);
			} else {
				newFavorites.add(index);
			}
			return newFavorites;
		});
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'Ouvert': return 'bg-green-500';
			case 'Fermé aujourd\'hui': return 'bg-gray-400';
			case 'Fermé': return 'bg-red-500';
			default: return 'bg-gray-400';
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 z-50 bg-white flex items-center justify-center w-screen h-screen">
				<div className="text-center w-full">
					<div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-green-500 mb-4"></div>
					<p className="text-gray-600 text-base font-medium">Chargement des restaurants...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-screen bg-gray-50 text-gray-900 overflow-x-hidden">
			{/* Header */}
			<header className="sticky top-0 z-30 bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="py-4">
						{/* Logo and Location */}
						<div className="flex items-center justify-between mb-4">
							<h1 className="text-2xl font-black text-gray-900">RestoNow</h1>
							<button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition text-sm font-medium">
								<MapPin size={16} className="text-gray-600" />
								<span className="text-gray-900">Livrer maintenant</span>
								<ChevronDown size={16} className="text-gray-600" />
							</button>
						</div>
						
						{/* Search */}
						<div className="relative mb-4">
							<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
							<input
								type="text"
								placeholder="Rechercher un restaurant ou une cuisine"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-12 pr-12 py-3.5 bg-gray-100 text-gray-900 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-green-500 transition placeholder-gray-500 font-normal"
							/>
							{searchTerm && (
								<button
									onClick={() => setSearchTerm('')}
									className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									<X size={20} />
								</button>
							)}
						</div>

						{/* Main Category Toggle */}
						<div className="flex gap-2 mb-4">
							<button
								onClick={() => setSelectedCategory('restaurants')}
								className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition ${
									selectedCategory === 'restaurants'
										? 'bg-black text-white'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
							>
								<span>🍽️</span>
								Restaurants
							</button>
							<button
								onClick={() => setSelectedCategory('bars')}
								className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition ${
									selectedCategory === 'bars'
										? 'bg-black text-white'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
							>
								<span>🍺</span>
								Bars
							</button>
						</div>

						{/* Category Pills with Emojis */}
						<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
							{(showAllTypes ? types : types.slice(0, MAX_VISIBLE_TYPES)).map(type => (
								<button
									key={type}
									onClick={() => setSelectedType(type)}
									className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition ${
										selectedType === type
											? 'bg-black text-white shadow-md'
											: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
									}`}
								>
									<span className="text-base">{getEmojiForType(type)}</span>
									{type}
								</button>
							))}

							{types.length > MAX_VISIBLE_TYPES && (
								<button
									onClick={() => setShowAllTypes(prev => !prev)}
									className="flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition border border-gray-200"
								>
									{showAllTypes ? '➖ Moins' : `➕ ${types.length - MAX_VISIBLE_TYPES} plus`}
								</button>
							)}
						</div>

						{/* Status Filter */}
						<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
							{statusOptions.map(option => (
								<button
									key={option}
									onClick={() => setStatusFilter(option)}
									className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
										statusFilter === option
											? 'bg-green-500 text-white'
											: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
									}`}
								>
									{option === 'Ouvert' && '✅'}
									{option === 'Fermé' && '🔴'}
									{option === 'Tous' && '🔍'}
									{option}
								</button>
							))}
						</div>

						{/* Distance Filter */}
						<div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2">
									<span className="text-2xl">📍</span>
									<span className="text-sm font-bold text-gray-900">Distance maximale</span>
								</div>
								<div className="flex items-baseline gap-1">
									<span className="text-lg font-bold text-green-600">{maxDistance.toFixed(1)}</span>
									<span className="text-xs font-semibold text-gray-500">km</span>
								</div>
							</div>
							
							{/* Precision indicator */}
							<div className="mb-2 text-xs text-gray-500 flex items-center gap-1">
								<span>🎯</span>
								<span>
									Précision: {maxDistance <= 2 ? '200m' : maxDistance <= 5 ? '500m' : maxDistance <= 10 ? '1km' : '2km'}
								</span>
							</div>
							
							<input
								type="range"
								min="0.1"
								max="10"
								step="0.1"
								value={maxDistance}
								onChange={(e) => handleDistanceChange(Number(e.target.value))}
								className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
								style={{
									background: `linear-gradient(to right, #10B981 0%, #10B981 ${(maxDistance / 10) * 100}%, #E5E7EB ${(maxDistance / 10) * 100}%, #E5E7EB 100%)`
								}}
							/>
							<div className="flex justify-between mt-2 text-xs text-gray-500">
								<span>0 km</span>
								<span>2,5 km</span>
								<span>5 km</span>
								<span>7,5 km</span>
								<span>10 km</span>
							</div>
							
							{/* Quick distance buttons */}
							<div className="flex gap-2 mt-3 flex-wrap">
								{[0.5, 1, 2, 2.5, 5, 10].map(dist => (
									<button
										key={dist}
										onClick={() => setMaxDistance(dist)}
										className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
											Math.round(maxDistance * 10) / 10 === dist
												? 'bg-green-500 text-white'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										}`}
									>
										{dist} km
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
				{/* Results Count */}
				<div className="mb-5">
					<h2 className="text-xl font-bold text-gray-900">
						{filteredPlaces.length} {selectedCategory === 'bars' ? 'bar' : 'restaurant'}{filteredPlaces.length !== 1 ? 's' : ''} disponible{filteredPlaces.length !== 1 ? 's' : ''}
					</h2>
					<p className="text-sm text-gray-500 mt-0.5">Près de vous</p>
				</div>

				{/* Places Grid */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
					{filteredPlaces.map((place, index) => (
						<div
							key={index}
							className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group border border-gray-100"
						>
							{/* Image Carousel */}
							<div className="relative">
								<ImageCarousel 
									images={Array.isArray(place.images_cover_link) ? place.images_cover_link : place.images_cover_link ? [place.images_cover_link] : []}
									title={place.title}
								/>
								
								{/* Favorite Button */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleFavorite(index);
									}}
									className="absolute top-2 right-2 bg-white hover:bg-gray-50 p-2 rounded-full transition shadow-md"
								>
									<Heart
										size={18}
										className={favorites.has(index) ? 'fill-green-500 text-green-500' : 'text-gray-600'}
									/>
								</button>

								{/* Status Badge */}
								<div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-md">
									<div className={`w-2 h-2 rounded-full ${getStatusColor(place.info)}`}></div>
									<span className="text-gray-900 text-xs font-bold">{place.info}</span>
								</div>
							</div>

							{/* Content */}
							<div className="p-4">
								{/* Title and Type */}
								<div className="mb-2">
									<h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-green-600 transition">
										{place.title}
									</h3>
									{place.type && (
										<div className="flex items-center gap-1.5">
											<span className="text-sm">{getEmojiForType(place.type)}</span>
											<span className="text-sm text-gray-600">{place.type}</span>
										</div>
									)}
								</div>

								{/* Address */}
								<div className="flex items-start gap-2 mb-3">
									<MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
									<div className="flex-1">
										<span className="text-xs text-gray-500 line-clamp-1 block">{place.address}</span>
										{place.distance_from_user && (
											<span className="text-xs text-green-600 font-semibold mt-0.5 block">
												📍 {place.distance_from_user.toFixed(1)} km
											</span>
										)}
									</div>
								</div>

								{/* Hours */}
								{place.current_day_hours && place.current_day_hours !== 'Closed' && (
									<div className="flex items-center gap-2 mb-3">
										<Clock size={14} className="flex-shrink-0 text-gray-400" />
										<span className="text-xs text-gray-500">{place.current_day_hours}</span>
									</div>
								)}

								{/* Service Options */}
								{place.service_options && place.service_options.length > 0 && (
									<div className="flex flex-wrap gap-1.5 mb-4">
										{place.service_options.slice(0, 2).map((option, idx) => (
											<span
												key={idx}
												className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md font-medium"
											>
												{option}
											</span>
										))}
										{place.service_options.length > 2 && (
											<span className="px-2 py-1 text-gray-400 text-xs font-medium">
												+{place.service_options.length - 2}
											</span>
										)}
									</div>
								)}

								{/* CTA Button */}
								<a
									href={place.google_maps_link}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition font-bold text-sm shadow-sm"
								>
									<MapPin size={16} />
									Voir l'itinéraire
								</a>
							</div>
						</div>
					))}
				</div>

				{/* Empty State */}
				{filteredPlaces.length === 0 && (
					<div className="text-center py-20">
						<div className="text-7xl mb-4">😔</div>
						<h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun résultat trouvé</h3>
						<p className="text-gray-600 mb-6">Essayez de modifier vos filtres ou votre recherche</p>
						<button
							onClick={() => {
								setSelectedType('All');
								setSearchTerm('');
								setStatusFilter('Tous');
								setMaxDistance(10);
							}}
							className="px-8 py-3.5 bg-black hover:bg-gray-800 text-white rounded-full font-bold transition"
						>
							Réinitialiser les filtres
						</button>
					</div>
				)}
			</main>
		</div>
	);
}

export default App;