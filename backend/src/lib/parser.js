import stringSimilarity from 'string-similarity';

const products = [
    "Stainless Steel Water Bottle 750mL",
    "Wireless Bluetooth Earbuds Pro",
    "4K Ultra HD Security Camera System",
    "Ergonomic Office Chair (Mesh Back)",
    "Rechargeable LED Camping Lantern",
    "Smart WiFi Programmable Thermostat",
    "Heavy-Duty Wheelbarrow (6 cu ft)",
    "3-Tier Commercial Baking Rack",
    "Industrial Wall-Mounted Tool Cabinet",
    "Hydraulic Floor Jack (3 Ton Capacity)",
    "Stainless Steel Commercial Griddle",
    "Noise-Canceling Over-Ear Headphones",
    "Portable Car Jump Starter 2000A",
    "Commercial-Grade Food Processor",
    "UV Water Purification System"
];

function findProductMatches(text) {
    const productMatches = [];
    
    products.forEach(product => {
        // Find all occurrences of the product in text
        const matches = text.matchAll(new RegExp(product, 'gi'));
        for (const match of matches) {
            if (match.index !== undefined) {
                productMatches.push({
                    product,
                    start: match.index,
                    end: match.index + product.length
                });
            }
        }
    });

    return productMatches.sort((a, b) => a.start - b.start);
}

function removeSubstrings(text, removals) {
    // Sort removals in reverse order to not affect other indices
    const sortedRemovals = [...removals].sort((a, b) => b.start - a.start);
    
    for (const { start, end } of sortedRemovals) {
        text = text.slice(0, start) + text.slice(end);
    }
    
    return text;
}

function findQuantities(text) {
    const quantPattern = /\d{1,6}\s*(?:units|pack|meter|kilogram|l|liter|g|m|kg|ml)/gi;
    return Array.from(text.matchAll(quantPattern)).map(match => match[0]);
}

function parseOrder(emailContent) {
    try {
        // Find product matches with their positions
        const productMatches = findProductMatches(emailContent);
        
        // Remove matched products from text
        const textWithoutProducts = removeSubstrings(
            emailContent, 
            productMatches
        );
        
        // Find quantities in remaining text
        const quantities = findQuantities(textWithoutProducts);
        
        // Create output object mapping products to quantities
        const output = {};
        productMatches.forEach((match, index) => {
            if (quantities[index]) {
                output[match.product] = quantities[index];
            }
        });
        
        // Add logic to detect special requests from keywords in the email content
        const hasSpecialRequest = emailContent.toLowerCase().includes('special request') || 
                                 emailContent.toLowerCase().includes('custom order') ||
                                 emailContent.toLowerCase().includes('specific requirements');
        
        // Return parsed data with flag
        return {
            ...output,
            flag: hasSpecialRequest ? 1 : 0
        };
    } catch (error) {
        console.error('Error parsing order:', error);
        return { flag: 1, error: error.message };
    }
}

export default parseOrder; 