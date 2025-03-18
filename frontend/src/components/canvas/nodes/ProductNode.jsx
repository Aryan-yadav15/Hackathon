import React, { useState, useEffect } from 'react'

const ProductNode = () => {
  const [products, setProducts] = useState([])
  const [nodeData, setNodeData] = useState(null)

  useEffect(() => {
    const loadProductDetails = async () => {
      if (!nodeData?.data?.productIds?.length) return
      
      try {
        const response = await fetch(`/api/products?ids=${nodeData.data.productIds.join(',')}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Failed to load product details:', error)
      }
    }
    
    loadProductDetails()
  }, [nodeData?.data?.productIds])

  return (
    <div>
      {/* Render your component content here */}
    </div>
  )
}

export default ProductNode 