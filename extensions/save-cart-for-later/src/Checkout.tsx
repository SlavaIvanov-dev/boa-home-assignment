import {
  reactExtension,
  Banner,
  BlockStack,
  useCartLines,
  Checkbox, Text, useCustomer, Button,
} from "@shopify/ui-extensions-react/checkout";
import {useEffect, useRef, useState} from "react";

interface SelectedProduct {
  id: string;
  title: string;
  selected: boolean;
}

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const cartLines = useCartLines();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const customerId = useCustomer().id;

  useEffect(() => {
    async function fetchCartData() {
      try {
        const response = await axios.get<SelectedProduct[]>("http://localhost:5000/api/cart/load", {
          params: { customerId },
        });
        setSelectedProducts(response.data);
      }catch (err){
        console.error("Error fetching cart", err);
      }
    }
    fetchCartData();
  }, []);

  useEffect(() => {
    const selectedItems = cartLines.map(cartLine => ({
      id: cartLine.id,
      title: cartLine.merchandise.title,
      selected: false
    }));
      setSelectedProducts(selectedItems);
  }, [cartLines]);

  function handleProductSelection(id: string) {
    setSelectedProducts(prevProducts => prevProducts.map(product=> product.id
     === id ? { ...product, selected : !product.selected } : product));
  }

  async function saveCartData() {
    try {
      await axios.post("http://localhost:5000/api/cart/save", {
        customerId,
        selectedProducts
      })
      alert("Cart saved successfully!")
    } catch (err) {
      console.error("Error saving cart", err);
    }
  }

  return (
    <BlockStack border={"dotted"} padding={"tight"}>
      <Banner title="save-cart-for-later">Save your cart</Banner>
      {selectedProducts.map(product => (
        <BlockStack key={product.id}>
          <Checkbox id={product.id} name={product.title} checked={product.selected} onChange={() =>handleProductSelection(product.id)}>
          <Text>{product.title}</Text>
          </Checkbox>
          </BlockStack>

      ))}
      <Button kind="primary" onPress={saveCartData}>Save Cart</Button>
    </BlockStack>
  );
}
