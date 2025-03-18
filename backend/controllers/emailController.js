const processEmail = async (req, res) => {
  try {
    console.log('Query params in POST:', req.query);
    console.log('Body in POST:', req.body);

    const { emailDetails } = req.body;
    console.log('Email details to parse:', emailDetails);

    // Extract email metadata using existing pattern
    const emailMetadata = extractEmailMetadata(emailDetails);
    console.log('Email metadata:', emailMetadata);

    // Fetch all products from the database to send to the parser API
    const products = await Product.findAll({
      attributes: ['name'],
    });
    const productNames = products.map(product => product.name);

    // Extract email body content (everything between @#Body- and the next @# tag)
    let emailText = '';
    const bodyMatch = emailDetails.match(/@#Body-(.*?)(@#|$)/s);
    if (bodyMatch && bodyMatch[1]) {
      emailText = bodyMatch[1].trim();
    }

    // Call the new parser API
    const parserResponse = await fetch('https://email-parser-livid.vercel.app/api/parser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: productNames,
        text: emailText
      }),
    });

    if (!parserResponse.ok) {
      throw new Error(`Parser API responded with status: ${parserResponse.status}`);
    }

    const parsedOrder = await parserResponse.json();
    console.log('Parsed order:', parsedOrder);

    // Continue with existing order creation logic
    const emailContent = emailDetails;
    const specialRequest = parsedOrder.flag === 1;

    // Create final response structure (maintaining existing format)
    const finalResponse = {
      emailMetadata: {
        ...emailMetadata,
        timestamp: new Date().toISOString(),
      },
      orderDetails: {
        products: { ...parsedOrder },
        specialRequest,
      },
      emailContent,
    };

    // Remove the flag property from the products object
    delete finalResponse.orderDetails.products.flag;

    console.log('Final response:', finalResponse);

    // Match products from the parsed order with products in the database
    const productEntries = Object.entries(finalResponse.orderDetails.products);
    const orderItems = [];
    let totalAmount = 0;

    for (const [productName, quantityStr] of productEntries) {
      const product = await Product.findOne({
        where: {
          name: productName,
        },
      });

      if (product) {
        console.log(`Debug - Product matched: "${productName}" (ID: ${product.id})`);
        const quantity = parseInt(quantityStr.split(' ')[0], 10);
        const subtotal = product.price * quantity;
        totalAmount += subtotal;

        orderItems.push({
          productId: product.id,
          quantity,
          unitPrice: product.price,
          subtotal,
        });
      }
    }

    // Generate a random order number
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create the order in the database
    const order = await Order.create({
      orderNumber,
      customerEmail: emailMetadata.from,
      orderDate: new Date(),
      status: 'pending',
      totalAmount,
      specialRequest,
      emailContent,
    });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item,
      });
    }

    const result = {
      orderId: order.id,
      orderNumber,
      itemsCount: orderItems.length,
      totalAmount,
      hasSpecialRequest: specialRequest,
    };

    console.log('Order creation result:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to extract email metadata
function extractEmailMetadata(emailDetails) {
  const subjectMatch = emailDetails.match(/@#Subject -\s*(.*?)(?=\s*@#|$)/);
  const fromMatch = emailDetails.match(/@#From -\s*(.*?)(?=\s*@#|$)/);
  const toMatch = emailDetails.match(/@#To-\s*(.*?)(?=\s*@#|$)/);

  return {
    subject: subjectMatch ? subjectMatch[1].trim() : '',
    from: fromMatch ? fromMatch[1].trim() : '',
    to: toMatch ? toMatch[1].trim() : '',
  };
}

processEmail.errorHandler = (err, req, res, next) => {
  console.error('Email processing error:', err);
  res.status(500).json({ 
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}; 