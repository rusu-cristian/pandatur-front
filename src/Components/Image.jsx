import { useState, useEffect } from "react";
import { Image as MantineImage, Flex, Text } from "@mantine/core";
import { IoWarningOutline } from "react-icons/io5";
import { getLanguageByKey } from "@utils";

const BROKEN_PHOTO = "/broken.png";

const fallbackImage = (fallback) => {
  if (fallback) {
    return fallback();
  }

  return (
    <Flex c="red" direction="column">
      <Flex align="center" gap="8">
        <Flex>
          <IoWarningOutline size={16} />
        </Flex>
        <Text size="xs">{getLanguageByKey("failToLoadImage")}</Text>
      </Flex>
    </Flex>
  );
};

const content = (renderImage, url) => {
  if (renderImage) {
    return renderImage();
  }

  return (
    <MantineImage
      fallbackSrc={BROKEN_PHOTO}
      my="5"
      radius="md"
      src={url}
      className="pointer"
      onClick={() => window.open(url, "_blank")}
    />
  );
};

export const Image = ({ url, renderImage, renderFallbackImage, style }) => {
  const [imageUrl, setImageUrl] = useState();

  useEffect(() => {
    if (!url) return;

    const img = new window.Image();
    img.src = url;

    img.onload = () => setImageUrl(url);
    img.onerror = () => setImageUrl(null);
  }, [url]);

  const fallback = fallbackImage(renderFallbackImage);
  const rendered = renderImage ? renderImage() : (
    <MantineImage
      fallbackSrc={BROKEN_PHOTO}
      my="5"
      radius="md"
      src={imageUrl}
      style={style}
      className="pointer"
      onClick={() => window.open(imageUrl, "_blank")}
    />
  );

  return <>{imageUrl ? rendered : fallback}</>;
};