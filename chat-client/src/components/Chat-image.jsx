import { useEffect, useState } from "react";
import ApiService from "../lib/api-service";

function ChatImage({ filePath }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  
  useEffect(() => {
    if (!filePath) return;

    const fetchSignedUrl = async () => {
      try {
        const url = await ApiService.refreshSignedUrl(filePath);
        setSignedUrl(url);
        console.log("sentUrl", url);
      } catch (err) {
        console.error("Failed to fetch signed URL:", err);
      }
    };

    fetchSignedUrl(); // initial load
    // const intervalId = setInterval(fetchSignedUrl, 60 * 60 * 1000);

    // return () => clearInterval(intervalId); // cleanup on unmount
  }, [filePath]);

  const handleClick = () => {
    setModalImage(signedUrl);
    setImageModalOpen(true);
  };
  const closeImageModal = () => {
    setImageModalOpen(false);
    setModalImage(null);
  };
  return (
    <>
      {" "}
      <img
        src={signedUrl || "/placeholder.svg"}
        alt="Shared image"
        className="chat-message-image"
        onClick={handleClick}
      />
      {imageModalOpen && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content">
            <img src={modalImage || "/placeholder.svg"} alt="Full size" />
          </div>
        </div>
      )}
    </>
  );
}
export default ChatImage;
