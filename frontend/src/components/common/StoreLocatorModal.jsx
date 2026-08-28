import { useState, useEffect } from "react";
import {
  MapPin,
  X,
  Phone,
  Clock,
  Navigation,
  CheckCircle,
  AlertCircle,
  Search,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { api } from "../../services/api";

const getDirectionsUrl = (store) => {
  const url = new URL("https://maps.google.com/");
  url.searchParams.set(
    "q",
    `${store.name}, ${store.address}, ${store.city}, ${store.state} ${store.zipCode || store.zip || ""}`
  );
  return url.href;
};

const StoreLocatorModal = ({
  isOpen,
  onClose,
  onSelectStore,
  selectedStoreId
}) => {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchCity, setSearchCity] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [activeStoreId, setActiveStoreId] = useState(selectedStoreId || null);
  useEffect(() => {
    if (isOpen) {
      loadStores();
    }
  }, [isOpen]);
  const loadStores = async (coords) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getStores(coords ? { lat: coords.lat, lng: coords.lng } : void 0);
      const storeList = Array.isArray(res) ? res : res?.stores || [];
      setStores(storeList);
      if (coords) {
        setUserLocation(coords);
      } else if (res?.userLocation) {
        setUserLocation(res.userLocation);
      }
      if (!activeStoreId && storeList.length > 0) {
        setActiveStoreId(storeList[0].id);
      }
    } catch (err) {
      console.error("Failed to load stores:", err);
      setErrorMsg("Unable to load nearby store locations. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("locating");
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationStatus("success");
        loadStores(coords);
      },
      (err) => {
        console.warn("Geolocation denied or unavailable:", err.message);
        setLocationStatus("denied");
        setErrorMsg("Location permission was denied. You can still search by city or zip code.");
        loadStores();
      },
      { timeout: 1e4, enableHighAccuracy: true }
    );
  };
  const filteredStores = stores.filter((st) => {
    if (!searchCity.trim()) return true;
    const query = searchCity.toLowerCase();
    const zipStr = st.zipCode || st.zip || "";
    return st.name.toLowerCase().includes(query) || st.city.toLowerCase().includes(query) || st.state.toLowerCase().includes(query) || zipStr.includes(query) || st.address.toLowerCase().includes(query);
  });
  const activeStore = stores.find((s) => s.id === activeStoreId) || filteredStores[0];
  if (!isOpen) return null;
  return <div
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    onClick={onClose}
  >
      <div
    className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
    onClick={(e) => e.stopPropagation()}
    id="store-locator-modal"
  >
        {
    /* Header */
  }
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Find a Vendora Retail & Pickup Store
              </h2>
              <p className="text-xs text-slate-500">
                Discover flagship stores, authorized pickup lockers, and express service counters near you.
              </p>
            </div>
          </div>

          <button
    onClick={onClose}
    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
    aria-label="Close store locator"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Search & Geolocation Bar */
  }
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
    type="text"
    value={searchCity}
    onChange={(e) => setSearchCity(e.target.value)}
    placeholder="Search by city, state, or ZIP (e.g. Seattle, NY 10001)..."
    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
    id="store-search-input"
  />
            {searchCity && <button
    onClick={() => setSearchCity("")}
    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
  >
                <X className="w-4 h-4" />
              </button>}
          </div>

          <button
    onClick={handleUseMyLocation}
    disabled={locationStatus === "locating"}
    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0"
    id="use-my-location-btn"
  >
            <Navigation className={`w-3.5 h-3.5 ${locationStatus === "locating" ? "animate-spin" : ""}`} />
            <span>
              {locationStatus === "locating" ? "Acquiring GPS..." : locationStatus === "success" ? "Nearby Stores Loaded" : "Use My Current Location"}
            </span>
          </button>
        </div>

        {
    /* Error notification if any */
  }
        {errorMsg && <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>}

        {
    /* Body Content: Split View (List on Left, Store Details on Right) */
  }
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {
    /* Left Column: Stores List */
  }
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto max-h-125 divide-y divide-slate-100 p-2">
            {isLoading ? <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Locating retail points...</p>
              </div> : filteredStores.length === 0 ? <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold">No stores found matching "{searchCity}"</p>
                <p className="text-slate-400">Try searching for a different city or state.</p>
              </div> : filteredStores.map((st) => {
    const isSelected = activeStore && activeStore.id === st.id || selectedStoreId === st.id;
    return <div
      key={st.id}
      onClick={() => setActiveStoreId(st.id)}
      className={`p-3.5 rounded-xl transition-all cursor-pointer text-left ${isSelected ? "bg-blue-50/80 border border-blue-200 shadow-xs" : "hover:bg-slate-50 border border-transparent"}`}
    >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                          {st.name}
                          {st.isPickupPoint && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                              Pickup Ready
                            </span>}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {st.address}, {st.city}, {st.state} {st.zipCode || st.zip || ""}
                        </p>
                      </div>

                      {st.distanceKm !== void 0 && <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                          {st.distanceKm.toFixed(1)} km
                        </span>}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {st.hours.split(",")[0]}
                      </span>
                      <span className="font-semibold text-blue-600 flex items-center gap-0.5">
                        View details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>;
  })}
          </div>

          {
    /* Right Column: Active Store Details & Directions */
  }
          <div className="md:col-span-7 p-6 overflow-y-auto bg-slate-50/50 flex flex-col justify-between">
            {activeStore ? <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Flagship Experience Center
                    </span>
                    {activeStore.distanceKm !== void 0 && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {activeStore.distanceKm.toFixed(1)} km from your position
                      </span>}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{activeStore.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {activeStore.address}, {activeStore.city}, {activeStore.state} {activeStore.zipCode || activeStore.zip || ""}
                  </p>
                </div>

                {
    /* Info Cards */
  }
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Operating Hours</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {activeStore.hours.replace(", ", "\n")}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Direct Contact</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">{activeStore.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Free 1-hour customer parking available</p>
                  </div>
                </div>

                {
    /* Available Store Amenities & Services */
  }
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Available In-Store Services
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Same-Day Online Order Pickup</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Technical Support & Genius Bar</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Free Product Audio Demos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hassle-Free Returns & Exchanges</span>
                    </div>
                  </div>
                </div>

                {
    /* Actions: Select For Pickup or Get Directions */
  }
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                  {onSelectStore && <button
    onClick={() => {
      onSelectStore(activeStore);
      onClose();
    }}
    className="w-full sm:flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
  >
                      <CheckCircle className="w-4 h-4" />
                      <span>Set as Preferred Pickup Store</span>
                    </button>}

                  <a
                    href={getDirectionsUrl(activeStore)}
    target="_blank"
    rel="noreferrer"
    className="w-full sm:w-auto py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
  >
                    <span>Get Directions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div> : <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select a store location from the list on the left to view hours and directions.
              </div>}
          </div>
        </div>

        {
    /* Footer */
  }
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredStores.length} locations available</span>
          <button
    onClick={onClose}
    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium"
  >
            Done
          </button>
        </div>
      </div>
    </div>;
};
export {
  StoreLocatorModal
};
