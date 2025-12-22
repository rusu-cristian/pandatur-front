const EMOJI = ["☺", "👍", "❤️", "😂", "😮", "😢", "😡"]

export const EmojiMessage = ({ onClickEmoji, id }) => {
  return (
    <>
      {EMOJI.map((reaction) => (
        <div
          key={reaction}
          onClick={() => onClickEmoji(reaction)}
          className={id === reaction ? "active" : ""}
        >
          {reaction}
        </div>
      ))}
    </>
  )
}
