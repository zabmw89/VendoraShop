"""
Management command to seed demo data.
ONLY runs when DEMO_MODE=true environment variable is set.
Passwords come from environment variables or are randomly generated.

Product catalog migrated from the legacy Express in-memory database (db.ts).
"""
import os
import secrets
import string
import logging

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from apps.accounts.models import UserProfile
from apps.products.models import (
    Category, Product, Coupon, NewsletterSubscriber, StoreLocation,
)

logger = logging.getLogger(__name__)


def generate_random_password(length=16):
    """Generate a cryptographically secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ---------------------------------------------------------------------------
# Default demo credentials
#
# These are published on purpose so anyone can log into the public live demo.
# The demo database holds no real data and can be reset at any time. For a
# private deployment, override them with the DEMO_ADMIN_PASSWORD and
# DEMO_CUSTOMER_PASSWORD environment variables (and keep DEMO_MODE unset).
# Keep these values in sync with the "Demo Credentials" section of README.md.
# ---------------------------------------------------------------------------
DEFAULT_DEMO_ADMIN_EMAIL = 'admin@vendorashop.com'
DEFAULT_DEMO_ADMIN_PASSWORD = 'DemoAdmin123!'
DEFAULT_DEMO_CUSTOMER_EMAIL = 'alex@example.com'
DEFAULT_DEMO_CUSTOMER_PASSWORD = 'DemoUser123!'


# ---------------------------------------------------------------------------
# Full product catalog — migrated from Express db.ts initialProducts
# ---------------------------------------------------------------------------
PRODUCTS = [
    {
        'slug': 'aeropulse-anc-wireless-headphones',
        'name': 'AeroPulse ANC Wireless Headphones',
        'brand': 'AeroAcoustics',
        'category_slug': 'audio',
        'short_description': 'Active noise-canceling over-ear headphones with 45-hour battery life and spatial audio.',
        'description': 'Experience studio-grade audio fidelity wherever you go. The AeroPulse ANC headphones feature 40mm custom planar magnetic drivers, adaptive hybrid noise cancellation that adjusts in real time, and ultra-plush memory foam earcups for all-day listening comfort.',
        'price': 249.99,
        'original_price': 299.99,
        'images': [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 24,
        'rating': 4.9,
        'review_count': 128,
        'is_featured': True,
        'tags': ['audio', 'bluetooth', 'noise-canceling', 'bestseller'],
        'specs': {
            'Driver Size': '40mm Titanium Composite',
            'Battery Life': 'Up to 45 Hours (ANC On)',
            'Connectivity': 'Bluetooth 5.3 + 3.5mm Aux',
            'Weight': '255g',
            'Charging': 'USB-C Fast Charge (10 min = 5 hours)',
        },
    },
    {
        'slug': 'novabook-pro-retina-ultra',
        'name': 'NovaBook Pro 15.6" Retina Ultra',
        'brand': 'NovaTech',
        'category_slug': 'electronics',
        'short_description': 'Ultra-thin aluminum workstation laptop with 3.2K OLED 120Hz display and 32GB RAM.',
        'description': 'Engineered for creators, developers, and power users. NovaBook Pro is equipped with a 12-core high-efficiency processor, 1TB NVMe PCIe 4.0 SSD, edge-to-edge 100% DCI-P3 OLED panel, and dual Thunderbolt 4 ports housed inside a precision CNC-machined aerospace-grade aluminum chassis.',
        'price': 1399.00,
        'original_price': 1549.00,
        'images': [
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 14,
        'rating': 4.8,
        'review_count': 64,
        'is_featured': True,
        'tags': ['laptop', 'computing', 'workstation', 'oled'],
        'specs': {
            'Display': '15.6" 3.2K OLED 120Hz HDR600',
            'Processor': '12-Core 4.8GHz Max Boost',
            'Memory': '32GB LPDDR5X 6400MHz',
            'Storage': '1TB NVMe Gen4 SSD',
            'Weight': '1.38 kg',
        },
    },
    {
        'slug': 'chronos-horizon-smartwatch-v4',
        'name': 'Chronos Horizon Smartwatch v4',
        'brand': 'Chronos Labs',
        'category_slug': 'wearables',
        'short_description': 'Titanium bezel smartwatch with continuous ECG, dual-band GPS, and 14-day battery.',
        'description': 'Track your vitality, sleep stages, and athletic milestones with surgical precision. The Chronos Horizon features an always-on Sapphire Glass AMOLED screen, 5ATM water resistance up to 50 meters, blood oxygen sensing, and seamless notifications with custom haptic feedback.',
        'price': 199.50,
        'original_price': 229.00,
        'images': [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 31,
        'rating': 4.7,
        'review_count': 92,
        'is_featured': True,
        'tags': ['smartwatch', 'fitness', 'gps', 'health'],
        'specs': {
            'Material': 'Grade 5 Titanium & Sapphire Glass',
            'Water Resistance': '5 ATM (50 meters)',
            'Sensors': 'ECG, PPG Optical Heart Rate, SpO2, GPS',
            'Battery': '14 Days Normal Usage / 36 Hours Active GPS',
            'Compatibility': 'iOS & Android',
        },
        'variants': {
            'colors': ['Titanium Silver', 'Midnight Black', 'Rose Gold'],
            'sizes': ['42mm', '46mm'],
        },
    },
    {
        'slug': 'lumina-studio-smart-desk-lamp',
        'name': 'Lumina Studio Smart Desk Lamp',
        'brand': 'Lumina Studio',
        'category_slug': 'home-living',
        'short_description': 'Circadian rhythm smart light bar with wireless phone charger base and touch slider.',
        'description': 'Transform your desk workspace with flicker-free, non-glare asymmetric lighting designed to reduce eye fatigue during long focus sessions. Features color temperature adjustment from 2700K warm sunset to 6500K daylight, and an integrated 15W Qi fast charging base.',
        'price': 89.00,
        'original_price': 110.00,
        'images': [
            'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 42,
        'rating': 4.6,
        'review_count': 45,
        'is_featured': False,
        'tags': ['lighting', 'desk', 'workspace', 'wireless-charging'],
        'specs': {
            'Brightness': '900 Lumens Max (CRI > 95)',
            'Color Temp': '2700K - 6500K Adjustable',
            'Base Power': '15W Fast Qi Wireless Pad',
            'Control': 'Capacitive Touch Slider + App Control',
        },
    },
    {
        'slug': 'vagabond-30l-commuter-backpack',
        'name': 'Vagabond 30L Weatherproof Commuter Backpack',
        'brand': 'Vagabond Gear',
        'category_slug': 'travel-gear',
        'short_description': 'Cordura ballistic nylon backpack with padded 16" laptop sleeve and TSA clamshell open.',
        'description': 'Designed for daily urban commuting and global weekend getaways. The Vagabond 30L combines water-repellent recycled Cordura fabric, YKK AquaGuard zippers, magnetic Fidlock buckles, an ergonomic breathable back panel, and a dedicated quick-access tech organizer pouch.',
        'price': 129.00,
        'original_price': 149.00,
        'images': [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 18,
        'rating': 4.9,
        'review_count': 78,
        'is_featured': True,
        'tags': ['backpack', 'travel', 'waterproof', 'everyday'],
        'specs': {
            'Capacity': '30 Liters',
            'Laptop Compartment': 'Suspended Padded (fits up to 16" Laptop)',
            'Material': '840D Cordura Ballistic Nylon',
            'Dimensions': '48cm x 31cm x 20cm',
            'Weight': '1.1 kg',
        },
    },
    {
        'slug': 'sonicblast-portable-speaker',
        'name': 'SonicBlast Portable Rugged Speaker',
        'brand': 'SonicWave',
        'category_slug': 'audio',
        'short_description': 'IP67 waterproof Bluetooth speaker with 360-degree punchy bass and 24-hr playtime.',
        'description': 'Take your soundtrack poolside, camping, or to the rooftop. The SonicBlast speaker delivers dual passive radiators, 30W stereo output, custom EQ modes via app, and can pair with up to 100+ companion speakers for multi-room sound sync.',
        'price': 79.99,
        'original_price': 99.99,
        'images': [
            'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 5,
        'rating': 4.8,
        'review_count': 110,
        'is_featured': False,
        'tags': ['speaker', 'waterproof', 'outdoor', 'audio'],
        'specs': {
            'Power Output': '30W RMS (Dual 15W drivers)',
            'Waterproof Rating': 'IP67 Submersible',
            'Battery': '24 Hours at 50% Volume',
            'Range': '30 Meters Bluetooth 5.2',
        },
    },
    {
        'slug': 'ergomesh-pro-task-chair',
        'name': 'ErgoMesh Pro Task Chair',
        'brand': 'ErgoLine',
        'category_slug': 'home-living',
        'short_description': 'Dynamic lumbar ergonomic office chair with 4D armrests and breathable elastomeric mesh.',
        'description': 'Say goodbye to back strain. The ErgoMesh Pro adapts automatically to your spine curve with responsive self-adjusting lumbar support, synchronous 135-degree recline with 4 locking positions, and a waterfall seat pan that relieves pressure on your legs.',
        'price': 349.00,
        'original_price': 420.00,
        'images': [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 9,
        'rating': 4.7,
        'review_count': 38,
        'is_featured': False,
        'tags': ['ergonomic', 'chair', 'desk', 'workspace'],
        'specs': {
            'Max Weight Capacity': '150 kg (330 lbs)',
            'Mechanism': 'Multi-function Wire-controlled Synchro-tilt',
            'Armrests': '4D (Height, Angle, Depth, Width)',
            'Frame': 'Polished Die-cast Aluminum Base',
        },
    },
    {
        'slug': 'merino-wool-overshirt',
        'name': 'Merino Wool All-Weather Overshirt',
        'brand': 'Nordic Thread',
        'category_slug': 'apparel',
        'short_description': 'Temperature-regulating 100% fine Merino wool overshirt with reinforced elbows.',
        'description': 'The ultimate layering piece for transition seasons. Crafted from 280gsm pure Australian Merino wool, it is naturally odor-resistant, breathable in warm weather, and insulating when temperatures drop. Finished with matte horn buttons and dual chest pockets.',
        'price': 115.00,
        'original_price': 135.00,
        'images': [
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 22,
        'rating': 4.8,
        'review_count': 51,
        'is_featured': False,
        'tags': ['apparel', 'merino', 'minimalist', 'jacket'],
        'specs': {
            'Fabric': '280gsm 100% Australian Merino Wool',
            'Fit': 'Regular with Articulated Elbows',
            'Closure': 'Matte Horn Buttons',
            'Care': 'Machine Washable Cold',
        },
        'variants': {
            'colors': ['Charcoal', 'Navy', 'Olive', 'Burgundy'],
            'sizes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        },
    },
    {
        'slug': 'puresound-studio-monitor-earbuds',
        'name': 'PureSound Studio Monitor Earbuds',
        'brand': 'AeroAcoustics',
        'category_slug': 'audio',
        'short_description': 'Triple balanced armature driver IEMs with detachable MMCX cable and memory foam tips.',
        'description': 'Designed for audiophiles and music producers. The PureSound Studio Monitor earbuds deliver ultra-detailed highs, warm midrange, and deep sub-bass with three precision balanced armature drivers per ear.',
        'price': 179.00,
        'original_price': 219.00,
        'images': [
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 16,
        'rating': 4.9,
        'review_count': 73,
        'is_featured': True,
        'tags': ['earbuds', 'audiophile', 'studio', 'iem'],
        'specs': {
            'Drivers': 'Triple Balanced Armature per Ear',
            'Cable': 'Detachable MMCX Silver-plated OFC',
            'Impedance': '32 Ohm',
            'Frequency Response': '20Hz - 20kHz',
        },
    },
    {
        'slug': 'glacier-breeze-portable-ac',
        'name': 'Glacier Breeze Portable Desktop AC',
        'brand': 'ArcticFlow',
        'category_slug': 'home-living',
        'short_description': 'Compact evaporative air cooler with 7-color mood light and whisper-quiet operation.',
        'description': 'Stay cool without the bulk. This portable evaporative cooler uses ice water and a honeycomb cooling pad to produce refreshing cold air with 60% less energy than a traditional AC unit.',
        'price': 59.00,
        'original_price': 79.00,
        'images': [
            'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 33,
        'rating': 4.3,
        'review_count': 29,
        'is_featured': False,
        'tags': ['cooling', 'portable', 'desk', 'summer'],
        'specs': {
            'Tank Capacity': '800ml',
            'Fan Speeds': '3 (Low / Medium / High)',
            'Noise Level': '< 40 dB',
            'Power': 'USB-C 5V or AC Adapter',
        },
    },
    {
        'slug': 'titan-grip-resistance-band-kit',
        'name': 'TitanGrip Resistance Band Kit Pro',
        'brand': 'FitCore',
        'category_slug': 'wearables',
        'short_description': '5-level latex resistance band set with ankle straps, door anchor, and carry pouch.',
        'description': 'Complete home gym in a bag. Includes 5 stackable resistance tubes (10-50 lbs each), padded ankle straps, foam door anchor, and a waterproof carry pouch for travel workouts.',
        'price': 34.99,
        'original_price': 49.99,
        'images': [
            'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 50,
        'rating': 4.6,
        'review_count': 88,
        'is_featured': False,
        'tags': ['fitness', 'resistance', 'home-gym', 'workout'],
        'specs': {
            'Band Levels': '5 (10 / 20 / 30 / 40 / 50 lbs)',
            'Max Combined': '150 lbs',
            'Material': '100% Natural Latex',
            'Includes': 'Bands, Handles, Ankle Straps, Door Anchor, Pouch',
        },
    },
    {
        'slug': 'trailblazer-polarized-sport-sunglasses',
        'name': 'TrailBlazer Polarized Sport Sunglasses',
        'brand': 'OpticEdge',
        'category_slug': 'travel-gear',
        'short_description': 'Lightweight TR90 frame polarized sunglasses with interchangeable lenses and UV400.',
        'description': 'Built for high-intensity outdoor sports. Featherweight TR90 frames hug your face without pinching, and the interchangeable lens system lets you swap between bright-day and low-light tints in seconds.',
        'price': 65.00,
        'original_price': 85.00,
        'images': [
            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 27,
        'rating': 4.7,
        'review_count': 42,
        'is_featured': False,
        'tags': ['sunglasses', 'outdoor', 'sport', 'polarized'],
        'specs': {
            'Frame': 'TR90 Flexible Memory Nylon',
            'Lens': 'TAC Polarized UV400',
            'Weight': '26g',
            'Includes': '3 Interchangeable Lenses, Hard Case, Microfiber Pouch',
        },
    },
    {
        'slug': 'pixelpad-mechanical-wireless-keyboard',
        'name': 'PixelPad Mechanical Wireless Keyboard',
        'brand': 'NovaTech',
        'category_slug': 'electronics',
        'short_description': 'Hot-swappable 75% wireless mechanical keyboard with gasket mount and PBT keycaps.',
        'description': 'A typing experience redefined. The PixelPad features a gasket-mounted plate for a soft, cushioned keystroke, tri-mode connectivity (Bluetooth 5.1, 2.4GHz, USB-C), and fully hot-swappable switches so you can customize your feel without soldering.',
        'price': 139.00,
        'original_price': 169.00,
        'images': [
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 19,
        'rating': 4.9,
        'review_count': 97,
        'is_featured': True,
        'tags': ['keyboard', 'mechanical', 'wireless', 'gaming'],
        'specs': {
            'Layout': '75% Compact (82 Keys)',
            'Switches': 'Custom Pre-lubed Tactile Panda (Hot-swap 5-pin)',
            'Battery': '4000mAh (Up to 200 hours without RGB)',
            'Keycaps': 'Double-shot PBT Cherry Profile',
        },
    },
    {
        'slug': 'arcadia-thermal-smart-flask',
        'name': 'Arcadia Thermal Smart Flask 750ml',
        'brand': 'Arcadia',
        'category_slug': 'travel-gear',
        'short_description': 'Vacuum insulated stainless steel bottle with digital temperature cap and UV-C sterilization.',
        'description': 'Keep beverages icy cold for 24 hours or piping hot for 12 hours. The integrated LCD touch cap displays exact liquid temperature in real-time and activates a 99.9% UV-C water purification cycle at the press of a button.',
        'price': 36.00,
        'original_price': 45.00,
        'images': [
            'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 35,
        'rating': 4.4,
        'review_count': 39,
        'is_featured': False,
        'tags': ['bottle', 'hydration', 'travel', 'insulated'],
        'specs': {
            'Capacity': '750ml (25 oz)',
            'Material': '18/8 Pro-Grade Stainless Steel (BPA-Free)',
            'Cap Battery': 'Magnetic Rechargeable (30 Days per Charge)',
            'Insulation': 'Triple-wall Copper Vacuum Layer',
        },
    },
    {
        'slug': 'aeropulse-clip-open-ear-sport',
        'name': 'AeroPulse Clip Open-Ear Sport Earphones',
        'brand': 'AeroAcoustics',
        'category_slug': 'audio',
        'short_description': 'Open-ear earhook headphones with directional audio drivers for situational awareness outdoors.',
        'description': 'Designed for runners, cyclists, and urban adventurers who need crisp music while staying alert to their surroundings. Featherlight memory-wire earhooks hold securely without canal fatigue.',
        'price': 99.00,
        'original_price': 129.00,
        'images': [
            'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 28,
        'rating': 4.7,
        'review_count': 63,
        'is_featured': False,
        'tags': ['earphones', 'running', 'sport', 'open-ear'],
        'specs': {
            'Design': 'Directional Acoustic Air Conduction',
            'Playtime': '10 Hours per charge (36 Hours total)',
            'Waterproof': 'IPX7 Sweat & Rain Proof',
            'Weight': '8.2g per ear',
        },
    },
    {
        'slug': 'apex-carbon-fiber-minimalist-wallet',
        'name': 'Apex Carbon Fiber Minimalist Wallet',
        'brand': 'ApexGear',
        'category_slug': 'travel-gear',
        'short_description': 'RFID-blocking 3K aerospace carbon fiber cardholder with integrated silicone cash strap.',
        'description': 'Ultra-lightweight and virtually indestructible. Holds up to 12 credit cards and folded bills with military-grade RFID blocking technology to protect your cards from wireless theft.',
        'price': 45.00,
        'original_price': 60.00,
        'images': [
            'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 40,
        'rating': 4.8,
        'review_count': 54,
        'is_featured': False,
        'tags': ['wallet', 'carbon-fiber', 'rfid', 'travel', 'accessories'],
        'specs': {
            'Material': 'Aerospace 3K Matte Carbon Fiber',
            'Capacity': '1-12 Cards + 10 Banknotes',
            'Weight': '42 grams',
            'Protection': 'Dual RFID/NFC 13.56MHz Shielding',
        },
    },
    {
        'slug': 'novacharge-magfast-3in1-charging-stand',
        'name': 'NovaCharge MagFast 3-in-1 Charging Stand',
        'brand': 'NovaTech',
        'category_slug': 'electronics',
        'short_description': 'Magnetic 15W wireless fast charger stand for iPhone, Apple Watch, and AirPods.',
        'description': 'Declutter your nightstand or desk. Features official Qi2 and MagSafe alignment for floating landscape or portrait standby charging, an integrated Apple Watch puck, and a 5W base pad for earbuds.',
        'price': 89.99,
        'original_price': 119.00,
        'images': [
            'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 26,
        'rating': 4.9,
        'review_count': 82,
        'is_featured': True,
        'tags': ['charging', 'magsafe', 'wireless', 'desk', 'apple'],
        'specs': {
            'Phone Output': '15W Fast Magnetic Wireless',
            'Watch Output': '5W Fast Charge Watch Module',
            'Earbuds Output': '5W Qi Base',
            'Construction': 'CNC Weighted Zinc Alloy + Silicone Pads',
        },
    },
    {
        'slug': 'komorebi-ambient-sound-machine',
        'name': 'Komorebi Ambient Sound Machine & Sunset Lamp',
        'brand': 'Lumina Studio',
        'category_slug': 'home-living',
        'short_description': 'Biophilic white noise generator and dimmable sunset wake-up light with 24 nature soundscapes.',
        'description': 'Fall asleep faster and wake up refreshed. Incorporates authentic high-fidelity acoustic recordings of rainforest rain, ocean surf, and mountain breeze combined with gradual sunrise/sunset light simulation.',
        'price': 68.00,
        'original_price': 85.00,
        'images': [
            'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 15,
        'rating': 4.7,
        'review_count': 47,
        'is_featured': False,
        'tags': ['wellness', 'sleep', 'sound-machine', 'home', 'lighting'],
        'specs': {
            'Soundtracks': '24 High-Resolution Nature Soundscapes',
            'Timer': '30, 60, 90 min Auto-off or Continuous',
            'Speaker': '5W High-Fidelity Down-firing Driver',
            'Light': 'Warm Amber 1800K - 3000K Sunset Dimming',
        },
    },
    {
        'slug': 'haloglow-pro-smart-screenbar',
        'name': 'HaloGlow Pro Smart ScreenBar Monitor Light',
        'brand': 'Lumina Studio',
        'category_slug': 'electronics',
        'short_description': 'Asymmetric glare-free monitor light bar with auto-dimming ambient light sensor.',
        'description': 'Eliminate eye strain and desk clutter. The HaloGlow Pro clips securely onto any monitor bezel, casting balanced uniform illumination across your entire desk without reflecting off the screen. Includes a precision weighted 2.4GHz wireless rotary dial.',
        'price': 79.00,
        'original_price': 99.00,
        'images': [
            'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 20,
        'rating': 4.8,
        'review_count': 41,
        'is_featured': True,
        'tags': ['lighting', 'desk', 'workspace', 'monitor', 'screenbar'],
        'specs': {
            'Color Temperature': '2700K - 6500K Stepless',
            'Color Rendering': 'Ra > 97 High CRI',
            'Mounting': 'Gravity Counterweight Clip (0.5cm - 4.5cm thickness)',
            'Power': 'USB-C 5V/2A',
        },
    },
    {
        'slug': 'aerogrip-magnetic-power-bank',
        'name': 'AeroGrip Magnetic 10,000mAh Power Bank',
        'brand': 'NovaTech',
        'category_slug': 'travel-gear',
        'short_description': 'Ultra-slim MagSafe compatible 15W wireless portable battery with fold-out kickstand.',
        'description': 'Pocket-sized powerhouse. Snaps effortlessly to the back of your smartphone providing 15W wireless charging on the go. High-grade aluminum enclosure with a zinc alloy kickstand for hands-free video viewing while charging.',
        'price': 54.00,
        'original_price': 69.00,
        'images': [
            'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 35,
        'rating': 4.9,
        'review_count': 68,
        'is_featured': False,
        'tags': ['powerbank', 'magsafe', 'travel', 'battery', 'portable'],
        'specs': {
            'Capacity': '10,000mAh / 38.5Wh',
            'Wireless Output': '15W Max Qi/MagSafe',
            'USB-C PD Output': '20W Fast Charging',
            'Thickness': '12.8mm Ultra-thin',
        },
    },
    {
        'slug': 'hydroshield-weatherproof-tech-sling',
        'name': 'HydroShield Weatherproof Tech Sling 6L',
        'brand': 'ApexGear',
        'category_slug': 'travel-gear',
        'short_description': 'Waterproof X-Pac fabric crossbody sling with dedicated 11" iPad sleeve.',
        'description': 'Engineered for seamless daily urban mobility and airport transit. Built from ultralight waterproof laminated X-Pac sailcloth with YKK AquaGuard weatherproof zippers, self-adjusting shoulder strap, and rapid magnetic release.',
        'price': 85.00,
        'original_price': 110.00,
        'images': [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 18,
        'rating': 4.8,
        'review_count': 39,
        'is_featured': False,
        'tags': ['sling', 'backpack', 'travel', 'waterproof', 'bag'],
        'specs': {
            'Material': 'Dimension-Polyant X-Pac VX21',
            'Volume': '6 Liters Expandable',
            'Device Compatibility': 'Fits up to 11-inch iPad Pro / Tablet',
            'Buckle': 'Fidlock V-Buckle 25 Magnetic',
        },
    },
    {
        'slug': 'ultraview-4k-oled-portable-monitor',
        'name': 'UltraView 4K OLED Portable Monitor 15.6"',
        'brand': 'NovaTech',
        'category_slug': 'electronics',
        'short_description': 'Ultra-slim 4K UHD OLED portable display with 100% DCI-P3 and dual USB-C.',
        'description': 'Elevate your mobile workstation with razor-sharp 4K OLED brilliance. Featuring true 10-bit color, 500 nits peak brightness, ultra-low 1ms latency, and a magnetic origami folding stand that doubles as a protective cover.',
        'price': 349.99,
        'original_price': 399.99,
        'images': [
            'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 15,
        'rating': 4.9,
        'review_count': 64,
        'is_featured': True,
        'tags': ['monitor', 'oled', 'display', 'electronics', 'portable', '4k'],
        'specs': {
            'Panel Type': '15.6" Samsung AMOLED 4K',
            'Color Gamut': '100% DCI-P3, Delta E < 1',
            'Connectivity': '2x Thunderbolt 4 / USB-C, 1x Mini HDMI',
            'Weight': '650g Ultralight CNC Aluminum',
        },
    },
    {
        'slug': 'quantumdeck-macro-stream-controller',
        'name': 'QuantumDeck Macro & Stream Controller',
        'brand': 'PixelPad',
        'category_slug': 'electronics',
        'short_description': '15 customizable LCD keys with rotary dials for streaming and creator workflows.',
        'description': 'Take complete tactile control of your streaming, audio mixing, video editing, and coding workflows. Features 15 vibrant customizable LCD key icons with multi-action macro triggers and two dual-function optical rotary dials.',
        'price': 139.99,
        'original_price': 169.99,
        'images': [
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 22,
        'rating': 4.8,
        'review_count': 47,
        'is_featured': False,
        'tags': ['controller', 'streamdeck', 'macros', 'electronics', 'gaming'],
        'specs': {
            'Keys': '15 Programmable IPS LCD Keys',
            'Dials': '2 Multifunction Clickable Knobs',
            'Interface': 'Detachable USB-C Braided Cable',
            'OS Support': 'macOS, Windows 11, Linux',
        },
    },
    {
        'slug': 'aurastudio-spatial-soundbar',
        'name': 'AuraStudio Spatial Wireless Soundbar',
        'brand': 'AeroAcoustics',
        'category_slug': 'audio',
        'short_description': 'Dolby Atmos compact room-filling soundbar with wireless subwoofer pairing.',
        'description': 'Transform your living room or desktop with cinematic Dolby Atmos spatial audio. Equipped with 6 precision-tuned drivers, dual upward-firing tweeters, and room acoustic self-calibration.',
        'price': 279.99,
        'original_price': 329.99,
        'images': [
            'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 12,
        'rating': 4.7,
        'review_count': 53,
        'is_featured': True,
        'tags': ['soundbar', 'audio', 'speakers', 'dolby atmos', 'wireless'],
        'specs': {
            'Total Power': '160W Peak Audio Output',
            'Audio Format': 'Dolby Atmos, DTS:X, Hi-Res Audio 24-bit',
            'Wireless': 'Wi-Fi 6, AirPlay 2, Spotify Connect, BT 5.3',
            'Inputs': 'eARC HDMI 2.1, Optical, AUX 3.5mm',
        },
    },
    {
        'slug': 'pulsering-horizon-smart-health-ring',
        'name': 'PulseRing Horizon Smart Health Ring',
        'brand': 'Chronos',
        'category_slug': 'wearables',
        'short_description': 'Titanium smart ring with sleep staging, continuous HRV, and body temperature tracking.',
        'description': 'Subtle, medical-grade biometric monitoring enclosed in aerospace titanium. Tracks deep sleep phases, HRV recovery scores, blood oxygen saturation, and activity with 7-day battery life and 100m water resistance.',
        'price': 199.99,
        'original_price': 249.99,
        'images': [
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 28,
        'rating': 4.8,
        'review_count': 91,
        'is_featured': True,
        'tags': ['smartring', 'wearable', 'health', 'fitness', 'biometrics'],
        'specs': {
            'Material': 'Grade 5 Titanium with PVD Diamond-Like Coating',
            'Battery Life': 'Up to 7 Days on a Single Charge',
            'Water Resistance': '10 ATM (100 meters submersible)',
            'Sensors': 'Optical PPG, Skin Temp, 3D Accelerometer',
        },
    },
    {
        'slug': 'aeroclean-pro-hepa-air-purifier',
        'name': 'AeroClean Pro H14 Smart Air Purifier',
        'brand': 'LuminaHome',
        'category_slug': 'home-living',
        'short_description': 'Medical-grade H14 True HEPA filter capturing 99.995% airborne pollutants.',
        'description': 'Breathe the cleanest air with dual-channel aerodynamic purification. Removes allergens, wildfire smoke, dust mites, and VOCs quietly at under 22dB in night mode. Connected with HomeKit, Alexa, and Google Assistant.',
        'price': 179.99,
        'original_price': 219.99,
        'images': [
            'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 19,
        'rating': 4.9,
        'review_count': 78,
        'is_featured': False,
        'tags': ['airpurifier', 'hepa', 'home', 'smart', 'cleanair'],
        'specs': {
            'Coverage Area': 'Up to 650 sq ft in 30 minutes',
            'Filter Grade': 'Medical Grade H14 True HEPA + Activated Carbon',
            'Noise Level': '21.5 dB Silent Night Mode',
            'Smart Integration': 'Matter, Apple HomeKit, Alexa, Google Home',
        },
    },
    {
        'slug': 'orbit-bamboo-dual-magfast-hub',
        'name': 'Orbit Bamboo Dual MagFast Charging Hub',
        'brand': 'NovaTech',
        'category_slug': 'home-living',
        'short_description': 'Sustainable solid bamboo dual 15W Qi2 magnetic fast charging pad.',
        'description': 'Handcrafted from sustainably sourced Moso bamboo and brushed anodized aluminum. Powers two MagSafe/Qi2 devices simultaneously at true 15W fast speed alongside an integrated USB-C accessory charging port.',
        'price': 79.99,
        'original_price': 99.99,
        'images': [
            'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 35,
        'rating': 4.6,
        'review_count': 42,
        'is_featured': False,
        'tags': ['charger', 'magsafe', 'bamboo', 'desk', 'wireless'],
        'specs': {
            'Material': 'Solid FSC-Certified Natural Bamboo & Aluminum',
            'Output': 'Dual 15W Qi2 Wireless + 10W USB-C Aux',
            'Safety': 'Foreign Object Detection & Overheat Protection',
            'Cable': '2m Braided USB-C Cable with 45W GaN Brick Included',
        },
    },
    {
        'slug': 'nomadpeak-packable-duffle-45l',
        'name': 'NomadPeak Ultralight Packable Duffle 45L',
        'brand': 'Vagabond',
        'category_slug': 'travel-gear',
        'short_description': 'Ripstop Cordura packable travel duffle compressing down to pocket size.',
        'description': 'Engineered for weekend escapes and gear-heavy adventures. Built from 210D High-Tenacity Cordura with water-repellent TPU coating, deployable ergonomic backpack straps, and reinforced bartack stress points.',
        'price': 109.99,
        'original_price': 139.99,
        'images': [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 24,
        'rating': 4.8,
        'review_count': 56,
        'is_featured': True,
        'tags': ['duffle', 'travel', 'backpack', 'cordura', 'gear'],
        'specs': {
            'Capacity': '45 Liters Carry-On Compliant',
            'Packed Size': '7 x 5 x 3 inches (Packs into internal pocket)',
            'Fabric': '210D HT Cordura Ripstop + YKK Weatherproof Zippers',
            'Weight': '380g Ultralight',
        },
    },
    {
        'slug': 'apex-stormproof-aerotech-parka',
        'name': 'Apex StormProof Aerotech Shell Parka',
        'brand': 'ApexGear',
        'category_slug': 'apparel',
        'short_description': '3-layer waterproof breathable technical jacket with magnetic storm flaps.',
        'description': 'Designed for harsh winter storms and rainy commutes. Features 20,000mm hydrostatic head waterproof rating, 30,000g/m² breathability, taped seams, fidlock magnetic closures, and hidden phone harness.',
        'price': 189.99,
        'original_price': 239.99,
        'images': [
            'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 16,
        'rating': 4.9,
        'review_count': 68,
        'is_featured': False,
        'tags': ['jacket', 'waterproof', 'parka', 'techwear', 'apparel'],
        'specs': {
            'Waterproof Rating': '20,000mm Hydrostatic Head',
            'Breathability': '30,000 g/m²/24hr',
            'Membrane': 'Bio-based 3-Ply Recycled Polyamide',
            'Fit': 'Articulated Ergonomic Athletic Fit',
        },
    },
    {
        'slug': 'komorebi-merino-knit-beanie',
        'name': 'Komorebi All-Weather Merino Knit Beanie',
        'brand': 'MerinoLab',
        'category_slug': 'apparel',
        'short_description': '100% extrafine Australian merino wool rib-knit temperature-regulating beanie.',
        'description': 'Super-soft, naturally odor-resistant, and breathable. Made with 19.5 micron extrafine merino wool that keeps you warm in freezing cold without overheating when indoors or hiking uphill.',
        'price': 38.00,
        'original_price': 48.00,
        'images': [
            'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
        ],
        'stock_quantity': 40,
        'rating': 4.7,
        'review_count': 33,
        'is_featured': False,
        'tags': ['beanie', 'merinowool', 'winter', 'apparel', 'accessories'],
        'specs': {
            'Material': '100% 19.5 Micron Extrafine Australian Merino Wool',
            'Weave': '7-Gauge Double-Layer Rib Knit',
            'Care': 'Machine Wash Cold / Lay Flat to Dry',
            'Origin': 'Certified Responsible Wool Standard (RWS)',
        },
    },
]

# ---------------------------------------------------------------------------
# Coupons — migrated from Express db.ts initialCoupons
# ---------------------------------------------------------------------------
COUPONS = [
    {'code': 'WELCOME10', 'discount_percent': 10, 'min_spend': 50, 'description': '10% discount on orders over $50'},
    {'code': 'VENDORA20', 'discount_percent': 20, 'min_spend': 150, 'description': '20% discount on premium orders over $150'},
    {'code': 'FREESHIP', 'discount_amount': 15, 'min_spend': 30, 'description': '$15 off (covers expedited shipping)'},
]

# ---------------------------------------------------------------------------
# Store locations — migrated from Express db.ts
# ---------------------------------------------------------------------------
STORES = [
    {'name': 'Vendora Flagship Market St', 'address': '850 Market Street', 'city': 'San Francisco', 'state': 'CA', 'zip_code': '94102', 'phone': '(415) 555-0199', 'hours': 'Mon-Sat: 10:00 AM - 9:00 PM, Sun: 11:00 AM - 7:00 PM', 'latitude': 37.7858, 'longitude': -122.4065},
    {'name': 'Vendora Tech Hub SoMa', 'address': '450 4th Street', 'city': 'San Francisco', 'state': 'CA', 'zip_code': '94107', 'phone': '(415) 555-0244', 'hours': 'Mon-Fri: 9:00 AM - 8:00 PM, Sat-Sun: 10:00 AM - 6:00 PM', 'latitude': 37.7812, 'longitude': -122.3998},
    {'name': 'Vendora Silicon Valley Studio', 'address': '320 University Ave', 'city': 'Palo Alto', 'state': 'CA', 'zip_code': '94301', 'phone': '(650) 555-0182', 'hours': 'Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 6:00 PM', 'latitude': 37.4443, 'longitude': -122.161},
    {'name': 'Vendora Seattle Flagship', 'address': '1500 5th Ave', 'city': 'Seattle', 'state': 'WA', 'zip_code': '98101', 'phone': '(206) 555-0177', 'hours': 'Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 6:00 PM', 'latitude': 47.6111, 'longitude': -122.3361},
    {'name': 'Vendora Century City Mall', 'address': '10250 Santa Monica Blvd', 'city': 'Los Angeles', 'state': 'CA', 'zip_code': '90067', 'phone': '(310) 555-0120', 'hours': 'Mon-Sat: 10:00 AM - 9:00 PM, Sun: 11:00 AM - 7:00 PM', 'latitude': 34.0594, 'longitude': -118.4194},
    {'name': 'Vendora SoHo Flagship', 'address': '520 Broadway', 'city': 'New York', 'state': 'NY', 'zip_code': '10012', 'phone': '(212) 555-0143', 'hours': 'Mon-Sat: 10:00 AM - 9:00 PM, Sun: 11:00 AM - 7:00 PM', 'latitude': 40.7233, 'longitude': -73.9984},
    {'name': 'Vendora Midtown Central', 'address': '100 W 33rd Street', 'city': 'New York', 'state': 'NY', 'zip_code': '10001', 'phone': '(212) 555-0188', 'hours': 'Daily: 9:00 AM - 9:00 PM', 'latitude': 40.7495, 'longitude': -73.989},
    {'name': 'Vendora Michigan Avenue', 'address': '700 N Michigan Ave', 'city': 'Chicago', 'state': 'IL', 'zip_code': '60611', 'phone': '(312) 555-0135', 'hours': 'Daily: 10:00 AM - 8:00 PM', 'latitude': 41.8953, 'longitude': -87.6243},
    {'name': 'Vendora Austin Domain', 'address': '11410 Century Oaks Terrace', 'city': 'Austin', 'state': 'TX', 'zip_code': '78758', 'phone': '(512) 555-0164', 'hours': 'Daily: 10:00 AM - 8:00 PM', 'latitude': 30.4021, 'longitude': -97.7262},
]


class Command(BaseCommand):
    help = 'Seed demo data (categories, products, coupons, stores, demo users). Only runs when DEMO_MODE=true.'

    def handle(self, *args, **options):
        demo_mode = os.environ.get('DEMO_MODE', 'false').lower() == 'true'

        if not demo_mode:
            raise CommandError(
                "DEMO_MODE is not enabled. Set DEMO_MODE=true to seed demo data.\n"
                "This command MUST NOT be run in production without explicit intent."
            )

        self.stdout.write(self.style.WARNING('⚠ DEMO_MODE is enabled. Seeding demo data...'))

        self._seed_demo_users()
        self._seed_categories()
        self._seed_products()
        self._seed_coupons()
        self._seed_stores()
        self._seed_newsletter()

        self.stdout.write(self.style.SUCCESS('✅ Demo data seeded successfully.'))

        admin_password = os.environ.get('DEMO_ADMIN_PASSWORD', DEFAULT_DEMO_ADMIN_PASSWORD)
        customer_password = os.environ.get('DEMO_CUSTOMER_PASSWORD', DEFAULT_DEMO_CUSTOMER_PASSWORD)
        self.stdout.write(self.style.SUCCESS(
            '\n──────────────────────────────────────────────\n'
            ' Demo credentials\n'
            '──────────────────────────────────────────────\n'
            f'  Admin    → {DEFAULT_DEMO_ADMIN_EMAIL} / {admin_password}\n'
            f'  Customer → {DEFAULT_DEMO_CUSTOMER_EMAIL} / {customer_password}\n'
            '──────────────────────────────────────────────'
        ))

    def _seed_demo_users(self):
        """
        Create demo admin and customer accounts.

        For a public, reproducible demo the passwords default to well-known
        values (see README "Demo Credentials"). These are intentionally
        published because the demo database carries no real data and can be
        reset at any time. Override them with the DEMO_ADMIN_PASSWORD /
        DEMO_CUSTOMER_PASSWORD environment variables for a private deployment.
        """
        admin_email = 'admin@vendorashop.com'
        admin_password = os.environ.get('DEMO_ADMIN_PASSWORD', DEFAULT_DEMO_ADMIN_PASSWORD)

        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'username': admin_email,
                'first_name': 'Vendora',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        # Always (re)apply the demo password + role so re-seeding a demo
        # deployment restores the documented, known-good credentials.
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password(admin_password)
        admin_user.save()
        profile = admin_user.profile
        profile.role = 'admin'
        profile.is_email_verified = True
        profile.phone = '+1 (555) 019-2831'
        profile.save()
        self.stdout.write(f'  {"Created" if created else "Updated"} admin: {admin_email}')

        customer_email = 'alex@example.com'
        customer_password = os.environ.get('DEMO_CUSTOMER_PASSWORD', DEFAULT_DEMO_CUSTOMER_PASSWORD)

        customer_user, created = User.objects.get_or_create(
            email=customer_email,
            defaults={
                'username': customer_email,
                'first_name': 'Alex',
                'last_name': 'Johnson',
            }
        )
        # Always (re)apply the demo password + role so re-seeding restores
        # the documented, known-good customer credentials.
        customer_user.set_password(customer_password)
        customer_user.save()
        profile = customer_user.profile
        profile.role = 'customer'
        profile.is_email_verified = True
        profile.phone = '+1 (555) 438-9102'
        profile.save()
        self.stdout.write(f'  {"Created" if created else "Updated"} customer: {customer_email}')

    def _seed_categories(self):
        categories = [
            {'name': 'Electronics & Computing', 'slug': 'electronics', 'description': 'High-performance laptops, tablets, smart monitors, and productivity essentials.', 'icon': 'Laptop'},
            {'name': 'Audio & Acoustics', 'slug': 'audio', 'description': 'Premium wireless headphones, studio earbuds, and room-filling sound systems.', 'icon': 'Headphones'},
            {'name': 'Smart Wearables', 'slug': 'wearables', 'description': 'Next-gen fitness trackers, smartwatches, and biometric accessories.', 'icon': 'Watch'},
            {'name': 'Home & Workspace', 'slug': 'home-living', 'description': 'Ergonomic furniture, ambient smart lighting, and minimalist desk gear.', 'icon': 'Home'},
            {'name': 'Travel & Lifestyle', 'slug': 'travel-gear', 'description': 'Weatherproof backpacks, compact chargers, and adventure-ready equipment.', 'icon': 'Compass'},
            {'name': 'Modern Apparel', 'slug': 'apparel', 'description': 'Minimalist techwear, organic cotton essentials, and all-weather jackets.', 'icon': 'Shirt'},
        ]

        for cat_data in categories:
            Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description'],
                    'icon': cat_data['icon'],
                }
            )

        self.stdout.write(f'  Seeded {len(categories)} categories.')

    def _seed_products(self):
        import copy
        # Build category lookup
        cats = {c.slug: c for c in Category.objects.all()}

        created_count = 0
        for raw_data in PRODUCTS:
            prod_data = copy.deepcopy(raw_data)
            cat_slug = prod_data.pop('category_slug')
            category = cats.get(cat_slug)
            if not category:
                self.stdout.write(self.style.WARNING(f'  Category "{cat_slug}" not found — skipping "{prod_data["name"]}"'))
                continue

            # Use first image as the primary 'image' field
            images = prod_data.pop('images', [])
            primary_image = images[0] if images else ''

            _, created = Product.objects.update_or_create(
                slug=prod_data['slug'],
                defaults={
                    'name': prod_data['name'],
                    'brand': prod_data.get('brand', ''),
                    'category': category,
                    'short_description': prod_data.get('short_description', ''),
                    'description': prod_data['description'],
                    'price': prod_data['price'],
                    'original_price': prod_data.get('original_price'),
                    'image': primary_image,
                    'images': images,
                    'tags': prod_data.get('tags', []),
                    'specs': prod_data.get('specs', {}),
                    'variants': prod_data.get('variants', {}),
                    'stock_quantity': prod_data['stock_quantity'],
                    'rating': prod_data['rating'],
                    'review_count': prod_data['review_count'],
                    'is_featured': prod_data['is_featured'],
                },
            )
            if created:
                created_count += 1

        self.stdout.write(f'  Seeded {len(PRODUCTS)} products ({created_count} new).')

    def _seed_coupons(self):
        created_count = 0
        for data in COUPONS:
            _, created = Coupon.objects.update_or_create(
                code=data['code'],
                defaults={
                    'discount_percent': data.get('discount_percent'),
                    'discount_amount': data.get('discount_amount'),
                    'min_spend': data.get('min_spend', 0),
                    'description': data.get('description', ''),
                    'is_active': True,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(f'  Seeded {len(COUPONS)} coupons ({created_count} new).')

    def _seed_stores(self):
        created_count = 0
        for data in STORES:
            _, created = StoreLocation.objects.update_or_create(
                name=data['name'],
                defaults=data,
            )
            if created:
                created_count += 1

        self.stdout.write(f'  Seeded {len(STORES)} store locations ({created_count} new).')

    def _seed_newsletter(self):
        NewsletterSubscriber.objects.get_or_create(
            email='alex@example.com',
            defaults={'discount_code': 'WELCOME10'},
        )
        self.stdout.write('  Seeded newsletter subscriber.')
