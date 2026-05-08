import store from '../store.js';
import { renderWordModal, initWordModalEvents } from '../components/modal.js';
import { playDing } from '../utils/sound.js';

let allExamples = [];
let currentExample = null;
let sentenceMode = 'vocab'; // 'vocab' | 'diary'

const DIARY_SENTENCES = [
  {
    vi: 'Buổi sáng tôi dậy sớm hơn bình thường, đi dạo quanh khu phố yên tĩnh và cảm nhận sự bình yên trước khi ngày mới bắt đầu.',
    en: 'This morning I woke up earlier than usual and decided to take a short walk around the neighborhood before breakfast. The air was cool and fresh, and the streets were still quiet and empty. I listened to the birds singing in the trees and let my thoughts wander freely without any particular direction. By the time I returned home, I felt genuinely calm and ready to face whatever the day had planned for me.',
    vi_full: 'Sáng nay tôi thức dậy sớm hơn mọi ngày và quyết định đi dạo một vòng quanh khu phố trước khi ăn sáng. Không khí mát mẻ và trong lành, và những con đường vẫn còn yên tĩnh và vắng vẻ. Tôi lắng nghe tiếng chim hót trên cây và để những suy nghĩ tự do trôi dạt mà không theo hướng nào cụ thể. Khi về đến nhà, tôi cảm thấy thực sự bình tĩnh và sẵn sàng đối mặt với bất kỳ điều gì ngày mới sẽ mang đến.',
  },
  {
    vi: 'Hành trình đi làm hôm nay kéo dài hơn bình thường vì tắc đường, và tôi đã dùng khoảng thời gian đó để suy nghĩ.',
    en: 'The journey to work took much longer than expected today because of unusually heavy traffic on the main road. I sat on the bus, staring out the window at the crowded streets below, and found myself thinking about how much of our lives we spend simply getting from one place to another. I decided to use the time more wisely and started listening to an English podcast I had been meaning to begin for several weeks.',
    vi_full: 'Hành trình đến nơi làm việc hôm nay mất nhiều thời gian hơn dự kiến vì tắc đường rất nặng trên đường chính. Tôi ngồi trên xe buýt, nhìn ra cửa sổ ngắm những con phố đông đúc bên dưới và thấy mình đang suy nghĩ về bao nhiêu thời gian trong cuộc đời chúng ta chỉ để di chuyển từ nơi này sang nơi khác. Tôi quyết định tận dụng khoảng thời gian đó một cách khôn ngoan hơn và bắt đầu nghe một podcast tiếng Anh mà tôi đã định nghe từ nhiều tuần trước.',
  },
  {
    vi: 'Sau một ngày dài mệt mỏi, tôi về đến nhà muộn và chỉ muốn được ngồi yên trong vài phút trước khi làm bất cứ điều gì.',
    en: 'After a long and exhausting day at work, I finally got home around eight in the evening, dropped my bag by the door, and collapsed onto the sofa without even taking off my shoes. I did not feel like cooking or talking to anyone. I just needed a few quiet minutes to decompress and let the stress of the day slowly fade before I could bring myself to think about anything else.',
    vi_full: 'Sau một ngày dài và kiệt sức ở nơi làm việc, cuối cùng tôi về đến nhà vào khoảng tám giờ tối, thả túi xuống cạnh cửa và đổ người xuống ghế sofa mà không kịp cởi giày. Tôi không muốn nấu ăn hay nói chuyện với bất kỳ ai. Tôi chỉ cần vài phút yên tĩnh để xả hơi và để căng thẳng trong ngày dần tan biến trước khi có thể tự mình suy nghĩ đến bất cứ điều gì khác.',
  },
  {
    vi: 'Tôi đã mong chờ cuối tuần này cả tuần vì đây là lần đầu tiên có hai ngày hoàn toàn không có nghĩa vụ nào cả.',
    en: 'I have been looking forward to this weekend for the entire week because I finally have two full days with absolutely no obligations, no deadlines, and no meetings to worry about. I am planning to sleep in a little on Saturday morning, visit the farmers market in the afternoon, and spend most of Sunday reading the novel I started last month but never found enough time to properly finish.',
    vi_full: 'Tôi đã mong chờ cuối tuần này cả tuần vì cuối cùng tôi có hai ngày hoàn toàn không có nghĩa vụ, không có hạn chót và không có cuộc họp nào phải lo lắng. Tôi dự định ngủ nướng một chút vào sáng thứ Bảy, ghé chợ nông sản vào buổi chiều, và dành phần lớn ngày Chủ Nhật đọc cuốn tiểu thuyết tôi bắt đầu từ tháng trước nhưng chưa bao giờ tìm đủ thời gian để đọc cho xong.',
  },
  {
    vi: 'Người bạn thân bất ngờ gọi điện tối nay và chúng tôi nói chuyện gần hai tiếng về đủ thứ trên đời.',
    en: 'My closest friend called me this evening completely out of the blue, and we ended up talking for almost two hours about everything and nothing in particular. We laughed together about old memories from university, shared our current worries about work and the future, and reminded each other how much we value the friendship we have slowly built and maintained over the past ten years of our lives.',
    vi_full: 'Người bạn thân nhất của tôi bất ngờ gọi điện tối nay, và chúng tôi nói chuyện gần hai tiếng về đủ mọi thứ và không có gì đặc biệt. Chúng tôi cùng cười về những kỷ niệm thời đại học, chia sẻ những lo lắng hiện tại về công việc và tương lai, và nhắc nhở nhau về giá trị của tình bạn mà chúng tôi đã dần dần xây dựng và duy trì suốt mười năm qua.',
  },
  {
    vi: 'Tôi thử nấu một món ăn mới tối nay từ đầu đến cuối, mất nhiều thời gian hơn dự kiến nhưng kết quả rất đáng công.',
    en: 'I tried cooking a completely new recipe for dinner this evening, a simple pasta dish with roasted vegetables and a homemade tomato sauce that I found in an old cookbook. It took me almost an hour from start to finish and left the kitchen in quite a mess, but the result was genuinely delicious. There is something deeply satisfying about making a proper meal from scratch and sitting down alone to enjoy it quietly.',
    vi_full: 'Tôi thử nấu một công thức hoàn toàn mới cho bữa tối, một món pasta đơn giản với rau nướng và sốt cà chua tự làm mà tôi tìm thấy trong một cuốn sách dạy nấu ăn cũ. Mất gần một tiếng từ đầu đến cuối và bếp khá lộn xộn sau đó, nhưng kết quả thực sự rất ngon. Có điều gì đó thỏa mãn sâu sắc khi tự tay làm một bữa ăn thực sự từ đầu rồi ngồi một mình thưởng thức trong yên tĩnh.',
  },
  {
    vi: 'Trước khi ngủ tối qua, tôi đọc sách khoảng nửa tiếng và cảm thấy đó là khoảng thời gian quý giá nhất trong ngày.',
    en: 'Before going to sleep last night, I spent about thirty minutes reading a novel I borrowed from the local library last week. It tells the story of a young woman who leaves her hometown to build a new life alone in an unfamiliar city. Reading good fiction before bed helps me to unwind and completely disconnect from the concerns of daily life in a way that almost nothing else manages to achieve for me.',
    vi_full: 'Trước khi đi ngủ tối qua, tôi dành khoảng ba mươi phút đọc một cuốn tiểu thuyết mượn từ thư viện địa phương tuần trước. Cuốn sách kể về một cô gái trẻ rời quê hương để xây dựng cuộc sống mới một mình ở một thành phố xa lạ. Đọc văn xuôi hay trước khi đi ngủ giúp tôi thư giãn và hoàn toàn thoát khỏi những lo lắng hàng ngày theo cách mà hầu như không có gì khác làm được.',
  },
  {
    vi: 'Công việc gần đây rất áp lực vì sắp đến hạn chót quan trọng và vẫn còn nhiều việc chưa hoàn thành.',
    en: 'Work has been unusually stressful lately because we are approaching a major project deadline and there is still a significant amount left to complete. I find myself checking emails on my phone even during weekends and evenings, which I know is not a healthy habit, but it is genuinely difficult to switch off completely when the pressure is this intense. I really need to find a better way to manage stress.',
    vi_full: 'Công việc gần đây căng thẳng bất thường vì chúng tôi đang tiến đến hạn chót của một dự án lớn và vẫn còn nhiều việc chưa hoàn thành. Tôi thấy mình kiểm tra email trên điện thoại ngay cả vào cuối tuần và buổi tối, điều mà tôi biết không phải thói quen lành mạnh, nhưng thực sự khó tắt hoàn toàn khi áp lực này cao đến vậy. Tôi thực sự cần tìm cách tốt hơn để quản lý căng thẳng.',
  },
  {
    vi: 'Chiều nay tôi đi dạo trong công viên gần nhà và ngồi bên hồ một lúc, cảm thấy tâm hồn nhẹ nhàng hơn rất nhiều.',
    en: 'This afternoon I took a long walk through the park near my apartment and sat on a wooden bench beside the small lake for quite a while. Watching the ducks glide calmly across the still water while families strolled by with their dogs reminded me how much I truly need these simple, unhurried moments in my life. Everything feels more manageable when I allow myself to slow down and breathe like this.',
    vi_full: 'Chiều nay tôi đi bộ dài qua công viên gần căn hộ và ngồi trên ghế gỗ bên hồ nhỏ một lúc khá lâu. Nhìn những con vịt lướt êm đềm trên mặt nước lặng yên trong khi các gia đình dạo bộ cùng chó nhắc tôi nhớ bao nhiêu tôi thực sự cần những khoảnh khắc đơn giản và thư thả này trong cuộc sống. Mọi thứ cảm thấy dễ quản lý hơn khi tôi cho phép bản thân chậm lại và hít thở như thế này.',
  },
  {
    vi: 'Gần đây tôi hay nghĩ về bà ngoại, có lẽ vì sinh nhật của bà vừa qua không lâu.',
    en: 'I have been thinking about my grandmother quite a lot recently, probably because her birthday would have been last week. She had a remarkable gift for making every single person around her feel genuinely seen and deeply heard. Her home always smelled warmly of cinnamon and something rich slow-cooking on the stove. I miss her quiet wisdom, her easy laughter, and the comforting feeling of simply sitting beside her in the afternoon light.',
    vi_full: 'Gần đây tôi hay nghĩ về bà ngoại khá nhiều, có lẽ vì sinh nhật của bà là tuần trước. Bà có tài năng đặc biệt khiến mỗi người xung quanh cảm thấy được nhìn nhận và lắng nghe thực sự. Ngôi nhà của bà luôn thơm mùi quế ấm áp và mùi thứ gì đó đang nấu chậm trên bếp. Tôi nhớ sự khôn ngoan yên lặng của bà, tiếng cười dễ dàng và cảm giác ấm áp khi chỉ đơn giản ngồi cạnh bà trong ánh chiều tà.',
  },
  {
    vi: 'Hôm nay tôi nhìn lại những mục tiêu đặt ra đầu năm và bất ngờ nhận ra mình đã tiến bộ nhiều hơn mình tưởng.',
    en: 'At the beginning of this year I carefully wrote down three personal goals I wanted to achieve by December, and today I finally took some time to sit down and honestly review how far I have actually come. I was genuinely surprised to find that I have made real and measurable progress on two of them, even though the year has not always gone exactly according to my original plan. This small moment of reflection gave me an unexpected boost of confidence.',
    vi_full: 'Đầu năm nay tôi cẩn thận ghi lại ba mục tiêu cá nhân muốn đạt được trước tháng Mười Hai, và hôm nay tôi cuối cùng dành thời gian ngồi xuống và thành thật nhìn lại mình đã đi được bao xa. Tôi thực sự ngạc nhiên khi thấy rằng mình đã đạt được tiến bộ thực sự và có thể đo đếm được ở hai trong số đó, dù năm không phải lúc nào cũng diễn ra đúng theo kế hoạch ban đầu. Khoảnh khắc suy ngẫm nhỏ bé này mang lại cho tôi một nguồn tự tin bất ngờ.',
  },
  {
    vi: 'Tôi mới bắt đầu học guitar được một tháng, vừa thấy thất vọng vừa có cảm giác thỏa mãn theo cách riêng của nó.',
    en: 'I started learning how to play the guitar about a month ago and I am finding it both deeply frustrating and genuinely rewarding at exactly the same time. My fingertips are still sore from pressing the metal strings every day and my sense of rhythm is quite poor, but every now and then I manage to get through a simple chord progression cleanly and without mistakes, and that small success always keeps me motivated to continue.',
    vi_full: 'Tôi bắt đầu học chơi guitar khoảng một tháng trước và tôi thấy nó vừa cực kỳ khó chịu vừa thực sự đáng công cùng một lúc. Đầu ngón tay vẫn còn đau vì nhấn dây kim loại mỗi ngày và cảm giác nhịp điệu của tôi còn khá yếu, nhưng thỉnh thoảng tôi vẫn chơi được một trình tự hợp âm đơn giản một cách trôi chảy và không mắc lỗi, và thành công nhỏ bé đó luôn giữ tôi có động lực để tiếp tục.',
  },
  {
    vi: 'Hôm nay mưa cả ngày, tôi ở nhà, uống trà và để thời gian trôi qua thật chậm rãi.',
    en: 'Today it rained steadily from early in the morning until well past midnight, so I decided to stay home for the entire day with a warm cup of tea and a favorite playlist playing softly in the background. I reorganized my bookshelf, finally replied to some messages I had been putting off for days, and spent a couple of pleasant hours simply watching the rain run down the window in long, winding streams.',
    vi_full: 'Hôm nay trời mưa liên tục từ sáng sớm cho đến quá nửa đêm, nên tôi quyết định ở nhà cả ngày với tách trà ấm và một danh sách nhạc yêu thích phát nhẹ nhàng trong nền. Tôi sắp xếp lại tủ sách, cuối cùng trả lời những tin nhắn đã trì hoãn nhiều ngày, và dành vài tiếng dễ chịu chỉ để nhìn những dòng mưa chạy dài trên ô cửa sổ.',
  },
  {
    vi: 'Tôi đang luyện tập lòng biết ơn mỗi ngày và nhận ra rằng thói quen nhỏ này đang dần thay đổi cách tôi nhìn thế giới.',
    en: 'I have been trying to practice gratitude more intentionally for the past few weeks, writing down three specific things I am genuinely thankful for each evening before going to sleep. At first the exercise felt forced and artificial, but after some time I began to notice my overall perspective shifting in real and meaningful ways. I catch myself appreciating small everyday moments more readily, like a kind word from a stranger or a beautiful sunset on my evening commute.',
    vi_full: 'Vài tuần qua tôi cố gắng thực hành lòng biết ơn một cách có chủ ý hơn, mỗi tối trước khi ngủ ghi xuống ba điều cụ thể mà tôi thực sự cảm ơn. Lúc đầu bài tập có cảm giác gượng gạo và giả tạo, nhưng sau một thời gian tôi bắt đầu nhận thấy góc nhìn tổng thể của mình thay đổi theo những cách thực sự và có ý nghĩa. Tôi thấy bản thân trân trọng những khoảnh khắc nhỏ hàng ngày dễ dàng hơn, như một lời tốt đẹp từ người lạ hay một hoàng hôn đẹp trên đường về.',
  },
  {
    vi: 'Quyết định rời công việc cũ là một trong những điều khó nhất tôi từng làm, nhưng nhìn lại thì đó là lựa chọn đúng đắn.',
    en: 'Making the decision to leave my previous job was genuinely one of the most difficult things I have ever done in my professional life, but six months later I can say with complete honesty that it was clearly the right choice. I had been quietly unhappy for a very long time but kept convincing myself that things would naturally improve on their own. Sometimes you have to find the courage to walk away from something familiar in order to discover something that truly suits you.',
    vi_full: 'Đưa ra quyết định rời công việc trước đó thực sự là một trong những điều khó khăn nhất tôi từng làm trong cuộc sống nghề nghiệp, nhưng sáu tháng sau tôi có thể nói thành thật rằng đó rõ ràng là lựa chọn đúng. Tôi đã lặng lẽ không hạnh phúc rất lâu nhưng cứ tự thuyết phục rằng mọi thứ sẽ tự nhiên cải thiện. Đôi khi bạn phải tìm đủ can đảm để bước đi khỏi thứ quen thuộc để khám phá thứ thực sự phù hợp với mình.',
  },
  {
    vi: 'Hôm nay bất ngờ là một ngày cực kỳ hiệu quả, tôi hoàn thành được nhiều việc hơn cả tuần trước cộng lại.',
    en: 'Today turned out to be a surprisingly productive day. I managed to finish three tasks I had been actively avoiding for over a week, cleared all my pending emails before lunchtime, and still had enough energy left in the evening to go for a short run before cooking dinner. On days like this I feel genuinely capable and properly in control of my life, and I try my best to hold onto that feeling for as long as I possibly can.',
    vi_full: 'Hôm nay hóa ra là một ngày làm việc hiệu quả bất ngờ. Tôi hoàn thành được ba nhiệm vụ đã tránh né hơn một tuần, xử lý hết tất cả email tồn đọng trước giờ ăn trưa, và vẫn còn đủ sức vào buổi tối để chạy bộ ngắn trước khi nấu cơm. Những ngày như thế này tôi cảm thấy thực sự có năng lực và hoàn toàn làm chủ cuộc sống, và tôi cố hết sức để giữ lấy cảm giác đó càng lâu càng tốt.',
  },
  {
    vi: 'Gần đây tôi hay mất động lực mà không hiểu lý do tại sao, dù mọi thứ xung quanh đều ổn.',
    en: 'I have been struggling with a lack of motivation recently and I am not entirely sure what is causing it. Everything in my life is objectively quite fine, but some mornings I wake up feeling completely flat and uninspired, as if I am simply going through the motions of daily life without any real sense of purpose or direction. A close friend reminded me that these low periods are entirely normal and that energy and drive always return eventually.',
    vi_full: 'Gần đây tôi đang vật lộn với sự thiếu động lực và không hoàn toàn chắc chắn điều gì gây ra. Mọi thứ trong cuộc sống của tôi khách quan mà nói đều khá tốt, nhưng một số buổi sáng tôi thức dậy cảm thấy hoàn toàn bằng phẳng và thiếu cảm hứng, như thể chỉ đang đi qua những động tác của cuộc sống hàng ngày mà không có mục đích hay hướng đi thực sự. Một người bạn thân nhắc tôi rằng những giai đoạn trầm xuống này hoàn toàn bình thường và năng lượng cùng động lực luôn quay trở lại.',
  },
  {
    vi: 'Có một quán cà phê nhỏ gần nhà mà tôi hay đến vào sáng thứ Bảy — đó là nơi tôi có thể suy nghĩ rõ ràng nhất.',
    en: 'There is a small independent coffee shop about ten minutes from my apartment where I like to spend Saturday mornings when the weather is pleasant. I always order exactly the same drink and settle into a chair by the window with my notebook open in front of me. I do not always write anything particularly meaningful, but something about the combination of quiet music, good coffee, and a blank page completely clears my head.',
    vi_full: 'Có một quán cà phê nhỏ độc lập cách căn hộ của tôi khoảng mười phút mà tôi thích đến vào sáng thứ Bảy khi thời tiết dễ chịu. Tôi luôn gọi đúng cùng một loại đồ uống và tự ổn định trên chiếc ghế bên cửa sổ với quyển sổ mở trước mặt. Tôi không phải lúc nào cũng viết được điều gì đặc biệt có ý nghĩa, nhưng sự kết hợp của âm nhạc nhẹ nhàng, cà phê ngon và một trang giấy trắng làm đầu óc tôi hoàn toàn trong sáng.',
  },
  {
    vi: 'Nhìn lại năm năm vừa qua, tôi ngạc nhiên khi nhận ra mình đã thay đổi đến mức nào mà không hề hay biết.',
    en: 'I have been quietly reflecting on how much I have changed and grown over the last five years of my life. The person I was at the beginning of that period would barely recognize who I have become today, not simply in terms of where I live or what I do for work, but in the deeper way I think about myself and understand the world around me. Personal growth is often completely invisible while it is happening, but looking back makes it unmistakable.',
    vi_full: 'Tôi đã lặng lẽ suy ngẫm về mình đã thay đổi và trưởng thành bao nhiêu trong năm năm qua. Người mà tôi là vào đầu giai đoạn đó hầu như không nhận ra tôi của ngày hôm nay, không chỉ về nơi ở hay công việc, mà ở cách sâu xa hơn tôi nghĩ về bản thân và hiểu thế giới xung quanh. Sự phát triển cá nhân thường hoàn toàn vô hình khi nó đang xảy ra, nhưng nhìn lại thì rất rõ ràng.',
  },
  {
    vi: 'Em gái tôi gọi điện nhờ tư vấn về một tình huống khó khăn ở trường và tôi đã cố gắng lắng nghe thật kỹ trước khi đưa ra ý kiến.',
    en: 'My younger sister called me yesterday afternoon to ask for some advice about a difficult situation she is currently dealing with at her university. I tried to listen very carefully and with full attention before offering any opinion or suggestion, because I know well from my own experience how genuinely frustrating it is when someone jumps immediately to giving solutions without first making you feel properly heard and understood. I hope what I eventually said was helpful.',
    vi_full: 'Em gái tôi gọi điện chiều qua để hỏi về một tình huống khó khăn mà cô ấy đang đối mặt ở trường đại học. Tôi cố gắng lắng nghe thật cẩn thận và chú ý hoàn toàn trước khi đưa ra bất kỳ ý kiến hay gợi ý nào, vì tôi biết rõ từ kinh nghiệm bản thân cảm giác bực bội như thế nào khi ai đó ngay lập tức đưa ra giải pháp mà không để bạn cảm thấy được lắng nghe trước. Tôi hy vọng những gì cuối cùng tôi nói có ích cho cô ấy.',
  },
  {
    vi: 'Tối qua tôi ngủ ngon suốt từ mười giờ đến bảy giờ sáng và cảm thấy thật sự tỉnh táo theo cách mà tôi gần như đã quên mất.',
    en: 'I went to bed at ten last night and slept all the way through until seven this morning without waking once, which almost never happens to me. I woke up feeling genuinely and completely rested in a way I had almost forgotten was possible. A truly good night of sleep changes absolutely everything about the following day. My mood is noticeably better, my thinking feels sharper and clearer, and problems that seemed overwhelming yesterday now feel entirely manageable.',
    vi_full: 'Tôi đi ngủ lúc mười giờ tối qua và ngủ liền mạch đến bảy giờ sáng mà không thức dậy lần nào, điều này hầu như không bao giờ xảy ra với tôi. Tôi thức dậy cảm thấy thực sự và hoàn toàn được nghỉ ngơi theo cách tôi gần như đã quên là có thể. Một đêm ngủ thực sự tốt thay đổi hoàn toàn mọi thứ về ngày hôm sau. Tâm trạng tôi tốt hơn rõ rệt, tư duy sắc bén và rõ ràng hơn, và những vấn đề có vẻ choáng ngợp hôm qua giờ cảm thấy hoàn toàn có thể xử lý được.',
  },
  {
    vi: 'Tôi mới bắt đầu thói quen chạy bộ ba buổi sáng mỗi tuần và đã cảm thấy sự khác biệt rõ rệt về mức năng lượng trong ngày.',
    en: 'I have started going for a thirty-minute run three mornings each week, and even though it has only been about a month since I began, I can already feel a clear and noticeable difference in my overall energy levels throughout the day. I never previously considered myself someone who genuinely enjoys regular exercise, but running in the early morning before the city fully wakes up has slowly become something I actually look forward to and miss when I skip a session.',
    vi_full: 'Tôi bắt đầu chạy bộ ba mươi phút vào ba buổi sáng mỗi tuần, và dù mới chỉ khoảng một tháng kể từ khi bắt đầu, tôi đã có thể cảm nhận sự khác biệt rõ ràng về mức năng lượng tổng thể trong ngày. Trước đây tôi chưa bao giờ coi mình là người thực sự thích tập thể dục thường xuyên, nhưng chạy bộ vào sáng sớm trước khi thành phố hoàn toàn thức dậy dần đã trở thành thứ tôi thực sự mong chờ và nhớ khi bỏ qua một buổi.',
  },
  {
    vi: 'Chủ nhật tuần trước cả gia đình tụ họp ở nhà bố mẹ lần đầu tiên sau nhiều tháng và buổi chiều đó thật ấm áp tự nhiên.',
    en: 'Last Sunday the entire family gathered for a long lunch at my parents house for the first time in several months, and it was one of those relaxed afternoons where everything just felt easy, warm, and completely natural. My mother cooked far too much food as she always does, my father told stories I have heard hundreds of times before, and my siblings and I laughed together until our stomachs genuinely hurt. I drove home feeling very full and deeply loved.',
    vi_full: 'Chủ Nhật tuần trước cả gia đình tụ họp ăn trưa lâu ở nhà bố mẹ lần đầu tiên sau nhiều tháng, và đó là một trong những buổi chiều thư thái mà mọi thứ đều cảm thấy dễ dàng, ấm áp và hoàn toàn tự nhiên. Mẹ nấu quá nhiều đồ ăn như thường lệ, bố kể những câu chuyện tôi đã nghe hàng trăm lần, và anh chị em chúng tôi cùng cười đến đau bụng. Tôi lái xe về nhà với cảm giác no đủ và được yêu thương sâu sắc.',
  },
  {
    vi: 'Tôi vừa hoàn thành một khóa học trực tuyến sau ba tháng kiên trì và cảm giác khi kết thúc tốt hơn tôi mong đợi.',
    en: 'I finally completed the online course I enrolled in three months ago, and honestly the feeling of finishing it was much better than I had anticipated. It was not always easy to find enough motivation and time after a full day of work, and there were at least two or three weeks when I seriously considered simply giving up and quitting entirely. But I stayed with it through those difficult moments, and now I have real new skills I am genuinely excited to use.',
    vi_full: 'Cuối cùng tôi hoàn thành khóa học trực tuyến đã đăng ký ba tháng trước, và thành thật mà nói cảm giác hoàn thành tốt hơn nhiều so với tôi kỳ vọng. Không phải lúc nào cũng dễ tìm đủ động lực và thời gian sau một ngày làm việc đầy đủ, và có ít nhất hai ba tuần tôi nghiêm túc cân nhắc đến việc bỏ cuộc. Nhưng tôi đã kiên trì qua những khoảnh khắc khó khăn đó, và giờ tôi có những kỹ năng mới thực sự mà tôi thực sự hào hứng được sử dụng.',
  },
  {
    vi: 'Mỗi tối sau bữa tối, tôi thường ngồi ngoài ban công nhỏ và nhìn khu phố xung quanh dần yên tĩnh lại vào ban đêm.',
    en: 'Sometimes in the evenings, after dinner and before I get ready for bed, I sit on my small balcony and quietly watch the neighborhood settle into the night around me. The street lights come on one by one, the traffic gradually thins out, and the temperature drops just enough to make a light jacket necessary and pleasant. These gentle transitions between the activity of day and the stillness of night are my favorite time, and I guard them carefully.',
    vi_full: 'Đôi khi vào buổi tối, sau bữa ăn và trước khi đi ngủ, tôi ngồi trên ban công nhỏ và lặng lẽ nhìn khu phố chìm vào đêm xung quanh. Những ngọn đèn đường sáng lên từng chiếc một, xe cộ thưa dần, và nhiệt độ giảm vừa đủ để cần một chiếc áo khoác nhẹ. Những chuyển tiếp nhẹ nhàng giữa sự sôi động của ban ngày và sự tĩnh lặng của đêm tối là thời gian yêu thích của tôi, và tôi trân trọng chúng.',
  },
  {
    vi: 'Tôi có thói quen uống cà phê một mình vào buổi sáng trước khi làm bất cứ điều gì — đó là khoảng thời gian chỉ dành riêng cho bản thân.',
    en: 'Every morning without exception, I make myself a cup of coffee and sit quietly at the kitchen table before looking at my phone or starting any work. It is a small ritual that I have kept for years, and it gives me a sense of calm and continuity no matter how uncertain or unpredictable the day ahead might feel. Those fifteen minutes belong entirely to me and I protect them fiercely.',
    vi_full: 'Mỗi sáng không có ngoại lệ, tôi pha cho mình một tách cà phê và ngồi yên tĩnh ở bàn bếp trước khi nhìn điện thoại hay bắt đầu bất kỳ công việc nào. Đó là một nghi lễ nhỏ tôi đã duy trì nhiều năm, và nó mang lại cho tôi cảm giác bình yên và liên tục dù ngày sắp đến có bất định hay khó đoán đến đâu. Mười lăm phút đó hoàn toàn thuộc về tôi và tôi bảo vệ chúng mạnh mẽ.',
  },
  {
    vi: 'Hôm nay tôi ghé vào một hiệu sách cũ và bị cuốn vào đó mất gần hai tiếng đồng hồ mà không hề hay biết.',
    en: 'I stopped into a second-hand bookshop this afternoon with the intention of buying just one book and ended up staying for nearly two hours. I moved slowly from shelf to shelf, pulling out old paperbacks, reading the first pages, and putting most of them back. I left with four books I had not planned on buying and a feeling of quiet happiness that only that particular kind of browsing can produce.',
    vi_full: 'Chiều nay tôi ghé vào một hiệu sách cũ với ý định mua chỉ một cuốn và cuối cùng ở lại gần hai tiếng. Tôi di chuyển chậm rãi từ kệ này sang kệ khác, lôi những cuốn sách bìa mềm cũ ra, đọc vài trang đầu rồi hầu hết để trở lại. Tôi rời đi với bốn cuốn sách không có trong kế hoạch và cảm giác hạnh phúc yên lặng mà chỉ kiểu lướt tìm đặc biệt đó mới tạo ra được.',
  },
  {
    vi: 'Tôi thức khuya tối qua để xem xong bộ phim mà mình đã trì hoãn mãi, và điều đó hoàn toàn xứng đáng.',
    en: 'I stayed up until almost midnight last night to finish watching a film I had been putting off for weeks, and it turned out to be completely worth the lost sleep. The story stayed with me long after the credits rolled and I lay in the dark thinking about it for a while before finally drifting off. Some films do that to you and I am always grateful when one does.',
    vi_full: 'Tôi thức đến gần nửa đêm tối qua để xem xong bộ phim mà tôi đã trì hoãn nhiều tuần, và hóa ra hoàn toàn xứng đáng với việc mất ngủ. Câu chuyện ở lại với tôi lâu sau khi phần tín dụng kết thúc và tôi nằm trong bóng tối suy nghĩ về nó một lúc trước khi cuối cùng thiếp đi. Một số bộ phim làm được điều đó với bạn và tôi luôn biết ơn khi gặp được một bộ như vậy.',
  },
  {
    vi: 'Tôi bắt đầu viết nhật ký trở lại sau nhiều năm bỏ quên và nhận ra rằng mình vẫn còn rất nhiều điều cần giải tỏa.',
    en: 'I started keeping a journal again last week after a gap of several years, and the first time I sat down to write I was surprised by how much there was to say. Thoughts and feelings that I had not consciously noticed began appearing on the page as if they had been waiting patiently for the right outlet. Writing by hand in a notebook feels slower and more honest than typing, and I had forgotten how much I missed it.',
    vi_full: 'Tôi bắt đầu viết nhật ký trở lại tuần trước sau nhiều năm gián đoạn, và lần đầu ngồi xuống viết tôi ngạc nhiên vì có bao nhiêu điều để nói. Những suy nghĩ và cảm xúc mà tôi chưa từng nhận thức một cách rõ ràng bắt đầu xuất hiện trên trang như thể chúng đã kiên nhẫn chờ đúng nơi để thoát ra. Viết tay trong sổ cảm thấy chậm hơn và thành thật hơn so với gõ phím, và tôi đã quên mình nhớ nó nhiều đến thế.',
  },
  {
    vi: 'Tôi cảm thấy hơi cô đơn hôm nay mặc dù không thiếu thứ gì để làm, đó là kiểu cô đơn khó giải thích nhất.',
    en: 'I felt a quiet kind of loneliness today that had nothing to do with being alone, which is the most difficult type to explain or deal with. I was busy all day, spoke to several people, and ate good food, and yet something felt slightly off, as if I was missing a connection I could not quite name. These moods usually pass by the following morning, and I have learned to simply let them move through.',
    vi_full: 'Hôm nay tôi cảm thấy một kiểu cô đơn yên lặng không liên quan gì đến việc ở một mình, đó là loại khó giải thích hay đối mặt nhất. Tôi bận rộn cả ngày, nói chuyện với nhiều người và ăn đồ ăn ngon, nhưng có gì đó cảm thấy hơi lệch, như thể tôi đang thiếu một kết nối nào đó mà tôi không thể đặt tên rõ. Những tâm trạng này thường qua đi vào buổi sáng hôm sau, và tôi đã học cách để chúng đi qua.',
  },
  {
    vi: 'Cuối tuần này tôi đi thăm một người bạn ở thành phố khác và chuyến đi ngắn ngủi đó nạp lại năng lượng cho tôi rất nhiều.',
    en: 'I visited a friend who lives in another city this weekend and the short trip did me more good than I expected. We spent the first evening just talking over a long dinner and catching up on the months that had passed since we last saw each other. Being somewhere different, sleeping in an unfamiliar room, and having unhurried conversations with someone I trust reminded me how important it is to get out of my usual routine.',
    vi_full: 'Tôi thăm một người bạn sống ở thành phố khác cuối tuần này và chuyến đi ngắn ngủi đó mang lại cho tôi nhiều điều tốt hơn tôi kỳ vọng. Chúng tôi dành buổi tối đầu tiên chỉ nói chuyện trong bữa tối dài và cập nhật những tháng đã qua kể từ lần cuối gặp nhau. Ở một nơi khác, ngủ trong phòng lạ và có những cuộc trò chuyện thư thả với người tôi tin tưởng nhắc tôi tầm quan trọng của việc thoát khỏi thói quen thường ngày.',
  },
  {
    vi: 'Tôi vừa học cách làm bánh mì tại nhà và mẻ đầu tiên tuy chưa hoàn hảo nhưng mang lại cảm giác tự hào kỳ lạ.',
    en: 'I baked my first loaf of bread from scratch this weekend, following a simple recipe I found online, and the result was imperfect but genuinely satisfying. The crust was slightly too dark and the inside was a little dense, but it smelled wonderful and tasted better than I expected. There is something almost magical about mixing basic ingredients together and pulling something edible out of the oven a few hours later.',
    vi_full: 'Tôi nướng ổ bánh mì đầu tiên từ đầu cuối tuần này, theo một công thức đơn giản tìm được trực tuyến, và kết quả không hoàn hảo nhưng thực sự thỏa mãn. Vỏ bánh hơi tối và bên trong hơi đặc, nhưng mùi thơm tuyệt vời và ngon hơn tôi kỳ vọng. Có điều gì đó gần như kỳ diệu khi trộn những nguyên liệu cơ bản lại với nhau và lấy ra thứ gì đó ăn được từ lò nướng vài tiếng sau.',
  },
  {
    vi: 'Tôi quyết định dọn dẹp và sắp xếp lại phòng làm việc của mình sau nhiều tháng để nó bừa bộn, và thấy tinh thần tốt hơn rõ rệt.',
    en: 'I spent most of Sunday morning clearing out and reorganizing my home office, which had gradually become quite chaotic over several months of busy work. I threw away a surprising amount of unnecessary paper, moved the desk to face a different wall, and bought a small plant to put near the window. By the afternoon the space felt entirely different, lighter and more inviting, and I actually wanted to sit down and work in it.',
    vi_full: 'Tôi dành phần lớn sáng Chủ Nhật để dọn dẹp và sắp xếp lại phòng làm việc tại nhà, nơi đã dần trở nên khá lộn xộn sau nhiều tháng làm việc bận rộn. Tôi bỏ đi một lượng giấy không cần thiết đáng ngạc nhiên, di chuyển bàn làm việc nhìn về hướng khác và mua một cây nhỏ đặt gần cửa sổ. Đến buổi chiều không gian cảm thấy hoàn toàn khác, nhẹ nhàng và hấp dẫn hơn, và tôi thực sự muốn ngồi xuống và làm việc trong đó.',
  },
  {
    vi: 'Tôi thử thiền định trong hai mươi phút tối nay lần đầu tiên và thấy khó hơn rất nhiều so với những gì tôi hình dung.',
    en: 'I tried meditating for twenty minutes this evening for the first time and found it considerably harder than I had imagined it would be. My mind refused to stay still for more than a few seconds at a time, jumping from one thought to another with no apparent logic or sequence. I did not achieve anything resembling calm, but I read that this is completely normal for beginners and that the practice itself is in the returning, not the staying.',
    vi_full: 'Tôi thử thiền hai mươi phút tối nay lần đầu tiên và thấy nó khó hơn đáng kể so với tưởng tượng. Tâm trí tôi từ chối yên tĩnh hơn vài giây mỗi lần, nhảy từ suy nghĩ này sang suy nghĩ khác không theo logic hay trình tự rõ ràng. Tôi không đạt được điều gì giống sự bình tĩnh, nhưng tôi đọc rằng đây hoàn toàn bình thường cho người mới và thực hành thiền là ở sự quay trở lại, không phải ở việc ở lại.',
  },
  {
    vi: 'Tôi vừa đặt vé cho một chuyến đi một mình đầu tiên trong đời và cảm giác hồi hộp lẫn háo hức khó tả.',
    en: 'I booked a solo trip for the first time in my life last night, a five-day journey to a city I have always wanted to visit but never had the right companion to go with. The moment I confirmed the payment I felt a strange mixture of excitement and mild panic settle over me. I have never traveled entirely alone before and I am not entirely sure what to expect, but something tells me this experience will be worth it.',
    vi_full: 'Tôi đặt chuyến đi một mình lần đầu tiên trong đời tối qua, hành trình năm ngày đến một thành phố tôi luôn muốn ghé thăm nhưng chưa bao giờ có người bạn đồng hành phù hợp. Khoảnh khắc xác nhận thanh toán, tôi cảm thấy một hỗn hợp kỳ lạ của sự phấn khích và hoảng loạn nhẹ ùa về. Tôi chưa bao giờ du lịch hoàn toàn một mình và không chắc chắn điều gì sẽ xảy ra, nhưng có gì đó nói với tôi rằng trải nghiệm này sẽ xứng đáng.',
  },
  {
    vi: 'Chiều nay tôi chạy đủ 5km lần đầu tiên mà không cần dừng lại và cảm giác khi về đích thật sự khó quên.',
    en: 'I ran five kilometers this afternoon without stopping for the very first time, and the feeling when I crossed the imaginary finish line in the park was one I will not forget quickly. My legs were heavy and my breathing was ragged by the end, but I kept going because I had convinced myself earlier that I would not walk no matter how uncomfortable it got. A small physical challenge like this reminds me that my limits are usually further out than I think.',
    vi_full: 'Chiều nay tôi chạy năm kilomet mà không dừng lần đầu tiên, và cảm giác khi vượt qua vạch đích tưởng tượng trong công viên là điều tôi sẽ không quên nhanh. Chân tôi nặng nề và hơi thở khó nhọc lúc cuối, nhưng tôi vẫn tiến vì đã tự hứa trước rằng sẽ không đi bộ dù khó chịu đến đâu. Một thử thách thể chất nhỏ như thế này nhắc tôi rằng giới hạn của mình thường ở xa hơn tôi nghĩ.',
  },
  {
    vi: 'Tôi nhận ra rằng mình đang dành quá nhiều thời gian trên mạng xã hội mỗi ngày và đã quyết định thay đổi.',
    en: 'I checked my screen time this week and was genuinely alarmed by how many hours I spend scrolling through social media every single day. The number was much higher than I expected and helped explain why I often feel restless and vaguely dissatisfied in the evenings without knowing exactly why. I decided to set a daily limit on my phone and to replace that time with something more deliberate, even if it is just sitting quietly with a book.',
    vi_full: 'Tôi kiểm tra thời gian sử dụng màn hình tuần này và thực sự giật mình vì tôi dành bao nhiêu giờ lướt mạng xã hội mỗi ngày. Con số cao hơn nhiều so với dự đoán và giúp giải thích tại sao tôi thường cảm thấy bồn chồn và mơ hồ không hài lòng vào buổi tối mà không biết tại sao. Tôi quyết định đặt giới hạn hàng ngày trên điện thoại và thay thế thời gian đó bằng điều gì đó có chủ đích hơn, dù chỉ là ngồi yên tĩnh với một cuốn sách.',
  },
  {
    vi: 'Hôm nay ông sếp cũ của tôi gửi tin nhắn đề nghị tôi cộng tác cho một dự án mới và tôi phân vân không biết có nên đồng ý không.',
    en: 'My former manager sent me a message today asking whether I would be interested in collaborating on a new project, and I have been thinking about it all afternoon without reaching a clear answer. The work sounds genuinely interesting and the money would be useful, but I left that job partly to gain more control over my time and I worry about giving some of that control back. I think I need another day before I can decide.',
    vi_full: 'Người quản lý cũ của tôi nhắn tin hỏi tôi có muốn cộng tác trong một dự án mới không, và tôi đã nghĩ về điều đó cả chiều mà không đến được câu trả lời rõ ràng. Công việc nghe có vẻ thực sự thú vị và tiền sẽ có ích, nhưng tôi rời công việc đó một phần để có thêm quyền kiểm soát thời gian và tôi lo lắng về việc giao lại một phần quyền kiểm soát đó. Tôi nghĩ cần thêm một ngày nữa trước khi có thể quyết định.',
  },
  {
    vi: 'Tôi đã học được một điều quan trọng tuần này: không phải tất cả mọi sự im lặng đều là sự đồng ý.',
    en: 'Something important became clear to me this week after a misunderstanding with someone I care about. I had assumed that their silence on a particular matter meant they were fine with how things were, but it turned out they had been quietly bothered for quite some time without saying anything. It reminded me that checking in with people directly, even when there are no obvious signs of a problem, is always worth the small effort it requires.',
    vi_full: 'Điều quan trọng trở nên rõ ràng với tôi tuần này sau một hiểu lầm với người tôi quan tâm. Tôi đã cho rằng sự im lặng của họ về một vấn đề có nghĩa là họ ổn với cách mọi thứ đang diễn ra, nhưng hóa ra họ đã lặng lẽ bị làm phiền khá lâu mà không nói gì. Điều đó nhắc tôi rằng hỏi thăm mọi người trực tiếp, ngay cả khi không có dấu hiệu rõ ràng của vấn đề, luôn xứng đáng với nỗ lực nhỏ mà nó đòi hỏi.',
  },
  {
    vi: 'Tôi đang lập kế hoạch học một ngôn ngữ mới và chưa chắc chắn nên bắt đầu từ đâu.',
    en: 'I have been seriously considering learning a third language for several months now and this week I finally sat down to make a proper plan. I spent an evening researching different methods, reading reviews of various apps and textbooks, and watching videos from people who had successfully learned the language I am interested in. The sheer amount of advice available online is both encouraging and slightly overwhelming, and I have decided to start small and build from there.',
    vi_full: 'Tôi đã nghiêm túc cân nhắc học ngôn ngữ thứ ba nhiều tháng và tuần này cuối cùng ngồi xuống lập kế hoạch đúng đắn. Tôi dành một buổi tối nghiên cứu các phương pháp khác nhau, đọc đánh giá các ứng dụng và sách giáo khoa, và xem video từ những người đã học thành công ngôn ngữ tôi quan tâm. Lượng lời khuyên khổng lồ trực tuyến vừa khích lệ vừa hơi choáng ngợp, và tôi quyết định bắt đầu nhỏ và xây dựng từ đó.',
  },
  {
    vi: 'Tôi dành cả buổi chiều nay để làm không gì cả — không điện thoại, không công việc — và cảm thấy đó là điều khó làm hơn tôi tưởng.',
    en: 'I spent the entire afternoon today deliberately doing nothing, no phone, no work, no plans of any kind, and discovered that genuine rest is harder to achieve than I expected. My mind kept generating tasks and reasons to be productive, and I had to consciously push back against the urge to check messages or tidy something up. It took about an hour before I finally settled into the quiet and started to feel what I think genuine leisure actually feels like.',
    vi_full: 'Tôi dành cả chiều nay cố tình không làm gì, không điện thoại, không công việc, không kế hoạch nào, và khám phá ra rằng nghỉ ngơi thực sự khó đạt được hơn tôi nghĩ. Tâm trí tôi cứ tiếp tục tạo ra các nhiệm vụ và lý do để làm gì đó, và tôi phải chủ động chống lại thôi thúc kiểm tra tin nhắn hay dọn dẹp gì đó. Mất khoảng một tiếng trước khi cuối cùng tôi định vào sự tĩnh lặng và bắt đầu cảm nhận điều mà tôi nghĩ là giải trí thực sự.',
  },
  {
    vi: 'Tôi đã gặp lại người bạn học cũ sau mười lăm năm không gặp và nhận ra chúng tôi đã thay đổi nhưng vẫn còn điều gì đó quen thuộc.',
    en: 'I ran into an old classmate from secondary school last week, someone I had not seen or spoken to in nearly fifteen years. We recognized each other immediately and stopped to talk for almost an hour on the pavement outside a supermarket. We have both changed enormously in the ways that time changes people, but there was still an ease to the conversation that came from sharing a particular chapter of each other lives, even such a distant one.',
    vi_full: 'Tôi tình cờ gặp lại một bạn học cũ thời trung học tuần trước, người tôi chưa gặp hay nói chuyện gần mười lăm năm. Chúng tôi nhận ra nhau ngay và dừng lại nói chuyện gần một tiếng trên vỉa hè ngoài siêu thị. Cả hai đều thay đổi rất nhiều theo cách thời gian thay đổi mọi người, nhưng vẫn có sự thoải mái trong cuộc trò chuyện đến từ việc đã chia sẻ một chương nhất định trong cuộc đời nhau, dù là chương xa xôi.',
  },
  {
    vi: 'Tôi vừa hoàn thành xong một cuốn sách rất dày mà tôi đã đọc dở dang nhiều lần — lần này cuối cùng tôi đã kiên nhẫn đủ để xong.',
    en: 'I finished a long and challenging novel last night that I had started and abandoned three separate times over the past two years. Each time I had put it down around the same point where the pace slows and the prose becomes very dense, but this time I pushed through that difficult section and found that the book opens up into something genuinely beautiful on the other side. I understand now why people consider it a classic, and I am glad I persisted.',
    vi_full: 'Tôi hoàn thành cuốn tiểu thuyết dài và thách thức tối qua mà tôi đã bắt đầu và bỏ dở ba lần riêng biệt trong hai năm qua. Mỗi lần tôi đặt xuống vào cùng một điểm khi nhịp độ chậm lại và văn xuôi trở nên rất dày đặc, nhưng lần này tôi vượt qua phần khó đó và thấy cuốn sách mở ra thành điều gì đó thực sự đẹp đẽ ở phía bên kia. Giờ tôi hiểu tại sao người ta coi đó là tác phẩm kinh điển, và tôi vui vì đã kiên trì.',
  },
  {
    vi: 'Tôi thức sớm để ngắm bình minh lần đầu tiên sau rất lâu và nhận ra đó là một thói quen đáng khôi phục.',
    en: 'I set my alarm early this morning and sat on the steps outside my building to watch the sunrise, something I have not done in years. The sky changed color so gradually that I almost missed each individual shift, moving through shades of dark blue and pale grey before finally arriving at a warm golden light. Sitting still and watching something as simple and reliable as the sun coming up put everything else in a different and more manageable perspective.',
    vi_full: 'Sáng nay tôi đặt đồng hồ báo sớm và ngồi trên bậc thềm ngoài tòa nhà để ngắm bình minh, điều tôi chưa làm nhiều năm. Bầu trời đổi màu từ từ đến mức tôi gần như bỏ lỡ từng bước chuyển tiếp, đi qua các sắc xanh đậm và xám nhạt trước khi cuối cùng đến ánh sáng vàng ấm. Ngồi yên và nhìn điều gì đó đơn giản và đáng tin cậy như mặt trời mọc đặt mọi thứ khác vào góc nhìn khác và dễ quản lý hơn.',
  },
  {
    vi: 'Tôi tham gia một lớp học nấu ăn cuối tuần và học được rằng việc nấu ăn giỏi cần sự tập trung nhiều hơn tôi tưởng.',
    en: 'I attended a weekend cooking class with a friend last Saturday and learned that cooking well requires far more focus and precision than I usually apply when I cook for myself at home. The instructor corrected my knife technique, my seasoning timing, and the temperature of my pan within the first twenty minutes. By the end of the class I had made a proper three-course meal I was genuinely proud of and come away with a new respect for professional cooks.',
    vi_full: 'Tôi tham dự lớp học nấu ăn cuối tuần với một người bạn Thứ Bảy vừa rồi và học được rằng nấu ăn ngon đòi hỏi sự tập trung và chính xác nhiều hơn những gì tôi thường áp dụng khi nấu tại nhà. Người hướng dẫn sửa kỹ thuật cắt, thời điểm nêm gia vị và nhiệt độ chảo của tôi trong vòng hai mươi phút đầu. Cuối buổi học tôi đã làm được một bữa ba món thực sự mà tôi tự hào và rời đi với sự kính trọng mới dành cho các đầu bếp chuyên nghiệp.',
  },
  {
    vi: 'Hôm nay tôi nhận ra rằng mình đã quá khắt khe với chính mình trong nhiều năm và đã đến lúc thay đổi điều đó.',
    en: 'I had a realization today that has been quietly forming for some time but finally became clear enough to name. I hold myself to standards I would never impose on anyone else, and when I fall short of them I am far harder on myself than the situation warrants. A close friend pointed this out to me gently over coffee and I found I could not argue with her. I am going to try to extend to myself some of the patience I find easy to give to others.',
    vi_full: 'Hôm nay tôi có một nhận thức đã hình thành lặng lẽ từ lâu nhưng cuối cùng đủ rõ ràng để đặt tên. Tôi tự đặt ra tiêu chuẩn cho bản thân mà tôi không bao giờ áp đặt cho ai khác, và khi không đạt tôi tự khắt khe hơn tình huống đòi hỏi rất nhiều. Một người bạn thân chỉ ra điều này nhẹ nhàng trong khi uống cà phê và tôi thấy mình không thể phản bác. Tôi sẽ cố gắng mở rộng cho bản thân một chút nhẫn nại mà tôi dễ dàng trao cho người khác.',
  },
  {
    vi: 'Trời bắt đầu vào thu và tôi cảm nhận được sự thay đổi đó không chỉ qua thời tiết mà còn qua tâm trạng của chính mình.',
    en: 'Autumn is arriving gradually this year, more through a shift in the quality of light than any dramatic drop in temperature. The mornings are darker and the evenings come sooner, and I find my mood changing in response in ways I cannot entirely control. I become more reflective in autumn, more inclined to stay home, to cook slow things, to make plans that involve warmth and smaller spaces. I have always found this season the most emotionally complex.',
    vi_full: 'Mùa thu đang đến dần năm nay, chủ yếu qua sự thay đổi chất lượng ánh sáng hơn là nhiệt độ giảm đột ngột. Những buổi sáng tối hơn và buổi tối đến sớm hơn, và tôi thấy tâm trạng mình thay đổi theo những cách tôi không hoàn toàn kiểm soát được. Tôi trở nên trầm tư hơn vào mùa thu, thích ở nhà hơn, nấu những thứ chậm rãi, lập kế hoạch liên quan đến sự ấm áp và không gian nhỏ hơn. Tôi luôn thấy mùa này là mùa phức tạp nhất về mặt cảm xúc.',
  },
  {
    vi: 'Tôi thử sống không có cà phê trong một tuần như một thử nghiệm nhỏ và hối hận về quyết định đó ngay từ ngày thứ hai.',
    en: 'I decided to give up coffee for one week as a small personal experiment, curious about whether my dependence on it was physical or simply habitual. By the second morning the headache was severe enough that I had to take a painkiller before work, which told me rather clearly that my dependence is very much physical. I completed the week out of stubbornness rather than any real belief in the exercise and immediately made coffee the following Monday morning.',
    vi_full: 'Tôi quyết định bỏ cà phê một tuần như một thử nghiệm cá nhân nhỏ, tò mò liệu sự phụ thuộc của mình là thể chất hay chỉ là thói quen. Đến buổi sáng thứ hai cơn đau đầu đủ nặng để tôi phải uống thuốc giảm đau trước khi đi làm, điều đó khá rõ ràng cho thấy sự phụ thuộc của tôi rất mang tính thể chất. Tôi hoàn thành tuần đó vì sự bướng bỉnh hơn là niềm tin thực sự vào thí nghiệm, và ngay lập tức pha cà phê vào sáng thứ Hai tiếp theo.',
  },
  {
    vi: 'Tôi ngồi xem lại những bức ảnh cũ trên điện thoại tối nay và bị cuốn vào đó mất gần một tiếng.',
    en: 'I spent almost an hour this evening scrolling back through old photographs on my phone, something I had not done in a long time. I found pictures from trips I had almost forgotten, meals eaten with people I am no longer in regular contact with, and moments of happiness that I did not recognize as particularly significant at the time they were captured. Looking back at your own life in this way is a strange and slightly melancholy pleasure.',
    vi_full: 'Tôi dành gần một tiếng tối nay lướt xem lại những bức ảnh cũ trên điện thoại, điều tôi chưa làm từ lâu. Tôi tìm thấy ảnh từ những chuyến đi mình gần như đã quên, bữa ăn cùng người không còn thường xuyên liên lạc, và những khoảnh khắc hạnh phúc mà tôi không nhận ra là đặc biệt quan trọng vào lúc chúng được chụp. Nhìn lại cuộc đời mình theo cách này là một niềm vui kỳ lạ và hơi buồn.',
  },
  {
    vi: 'Tôi mua một cây trồng trong nhà đầu tiên của mình hôm nay và đã đọc rất kỹ hướng dẫn chăm sóc vì tôi thực sự không muốn nó chết.',
    en: 'I bought my very first houseplant today from the small flower stall near my office, a modest fern in a terracotta pot that the seller promised was difficult to kill. I spent twenty minutes reading about the correct amount of light and water it needs before placing it on my windowsill and standing back to look at it with a feeling that was somewhere between pride and anxiety. I would very much like to keep this one alive.',
    vi_full: 'Hôm nay tôi mua cây trồng trong nhà đầu tiên từ quầy hoa nhỏ gần văn phòng, một cây dương xỉ khiêm tốn trong chậu đất nung mà người bán hứa khó chết. Tôi dành hai mươi phút đọc về lượng ánh sáng và nước cần thiết trước khi đặt nó trên bệ cửa sổ và đứng nhìn lại với cảm giác nằm giữa tự hào và lo lắng. Tôi rất muốn giữ cây này sống được.',
  },
  {
    vi: 'Tôi mời bạn bè về nhà ăn tối lần đầu tiên và cảm thấy hồi hộp một cách kỳ lạ dù chỉ là bữa ăn thân mật.',
    en: 'I cooked dinner for three friends at my apartment for the first time last Friday and found myself unexpectedly nervous in the hours before they arrived. I had cleaned the flat twice, changed the menu twice, and spent too long arranging things that nobody would notice. But the evening turned out to be warm and relaxed, the food was well received, and we sat at the table talking long after the meal was finished. I will do it again soon.',
    vi_full: 'Tôi nấu bữa tối cho ba người bạn tại căn hộ lần đầu tiên tối Thứ Sáu vừa rồi và thấy mình hồi hộp bất ngờ trong những giờ trước khi họ đến. Tôi đã dọn dẹp căn hộ hai lần, đổi thực đơn hai lần và tốn quá nhiều thời gian sắp xếp những thứ chẳng ai để ý. Nhưng buổi tối hóa ra ấm áp và thoải mái, thức ăn được đón nhận tốt, và chúng tôi ngồi ở bàn nói chuyện lâu sau khi bữa ăn kết thúc. Tôi sẽ làm lại sớm.',
  },
  {
    vi: 'Tôi đọc được một câu trích dẫn sáng nay mà nó cứ ở trong đầu tôi suốt cả ngày.',
    en: 'I came across a short quotation this morning while reading and it has stayed with me throughout the entire day, surfacing repeatedly at unexpected moments. It said something simple about how the way we spend our ordinary days is ultimately the way we spend our lives, which is not a new idea but was expressed in a way that felt newly direct and impossible to dismiss. I wrote it down and put it somewhere I will see it regularly.',
    vi_full: 'Sáng nay tôi tình cờ đọc một câu trích dẫn ngắn và nó ở lại với tôi suốt cả ngày, xuất hiện lại nhiều lần vào những khoảnh khắc bất ngờ. Nó nói điều gì đó đơn giản về cách chúng ta dành những ngày bình thường của mình cuối cùng là cách chúng ta dành cuộc đời, không phải ý tưởng mới nhưng được diễn đạt theo cách cảm thấy trực tiếp và không thể bác bỏ. Tôi ghi lại và đặt ở nơi sẽ thường xuyên nhìn thấy.',
  },
  {
    vi: 'Tôi đang cố gắng ăn uống lành mạnh hơn nhưng mỗi lần đi ngang tiệm bánh gần nhà thì ý chí của tôi lại sụp đổ hoàn toàn.',
    en: 'I have been making a genuine effort to eat more carefully for the past three weeks, focusing on vegetables, cutting back on sugar, and cooking at home more often. The plan is going reasonably well on most days, but there is a very good bakery on my route home from work that tests my resolve every single evening. I manage to walk past it three days out of five, which I have decided to count as a reasonable success rate.',
    vi_full: 'Ba tuần qua tôi đang thực sự nỗ lực ăn uống cẩn thận hơn, tập trung vào rau, cắt giảm đường và nấu ăn tại nhà thường xuyên hơn. Kế hoạch diễn ra khá tốt vào hầu hết các ngày, nhưng có một tiệm bánh rất ngon trên đường về từ chỗ làm thử thách ý chí của tôi mỗi buổi tối. Tôi đi qua được ba trong năm ngày, điều mà tôi quyết định coi là tỉ lệ thành công chấp nhận được.',
  },
  {
    vi: 'Tôi dành cả buổi sáng thứ Bảy để đạp xe quanh khu vực mình chưa từng khám phá và tìm thấy một con đường rất đẹp.',
    en: 'I spent Saturday morning cycling through a part of the city I rarely visit and ended up discovering a quiet residential street lined with old trees that I had never known existed. I stopped and sat on a bench there for a while, watching a cat cross the road very slowly and a man trimming his hedge with great concentration. Finding an unexpected beautiful corner of a familiar city feels like a small gift, and I will go back.',
    vi_full: 'Tôi dành buổi sáng Thứ Bảy đạp xe qua một khu vực thành phố hiếm khi đến và cuối cùng khám phá ra một con phố dân cư yên tĩnh rợp bóng cây cổ thụ mà tôi chưa bao giờ biết tồn tại. Tôi dừng lại ngồi trên ghế một lúc, nhìn một con mèo băng qua đường rất chậm và một người đàn ông cắt tỉa hàng rào với sự tập trung cao độ. Tìm thấy một góc đẹp bất ngờ trong thành phố quen thuộc cảm thấy như một món quà nhỏ.',
  },
  {
    vi: 'Tôi nhận ra rằng mình đã nói "tôi không có thời gian" quá nhiều trong khi thực ra là "tôi không coi đó là ưu tiên".',
    en: 'I have been reconsidering how I use the phrase I do not have time for things, which I say very often. A friend pointed out recently that saying you do not have time for something is almost never literally true, and that what you really mean is that it is not a priority. This distinction sounds small but it changes the nature of the choice entirely and makes me much more honest with myself about what I am actually choosing to do or not do.',
    vi_full: 'Tôi đang xem xét lại cách mình dùng cụm từ "không có thời gian", điều tôi nói rất thường xuyên. Một người bạn gần đây chỉ ra rằng nói bạn không có thời gian cho điều gì đó hầu như không bao giờ đúng nghĩa đen, và điều bạn thực sự muốn nói là nó không phải ưu tiên. Sự phân biệt này nghe nhỏ nhưng thay đổi hoàn toàn bản chất của lựa chọn và khiến tôi thành thật hơn nhiều với bản thân về điều mình thực sự đang chọn làm hay không làm.',
  },
  {
    vi: 'Tôi trồng rau lần đầu tiên trên ban công và cảm giác nhìn thấy hạt giống nảy mầm thật sự rất thú vị.',
    en: 'I planted a small container herb garden on my balcony three weeks ago, filling three pots with basil, mint, and parsley seeds, and this week the first tiny green shoots have appeared. I have been checking on them every morning and evening with a degree of attention that I recognize as slightly disproportionate. There is something about growing something from a seed that feels both very simple and unexpectedly meaningful, and I understand now why people find gardening addictive.',
    vi_full: 'Ba tuần trước tôi trồng một vườn rau thơm nhỏ trên ban công, đổ đầy ba chậu với hạt giống húng quế, bạc hà và mùi tây, và tuần này những chồi xanh nhỏ đầu tiên đã xuất hiện. Tôi kiểm tra chúng mỗi sáng và tối với mức độ chú ý mà tôi nhận ra là hơi không tương xứng. Có điều gì đó về việc trồng thứ gì đó từ hạt giống vừa cảm thấy rất đơn giản vừa có ý nghĩa bất ngờ, và giờ tôi hiểu tại sao người ta thấy làm vườn gây nghiện.',
  },
  {
    vi: 'Tôi cãi nhau với người thân và cả ngày hôm nay đều mang theo cảm giác nặng nề đó theo mình.',
    en: 'I had a disagreement with someone close to me yesterday and spent most of today carrying the weight of it around without being able to fully concentrate on anything else. We did not shout, but the words were sharper than they needed to be, and I have been replaying the conversation in my head trying to identify where it went wrong. I know I should reach out and talk properly rather than waiting, but I have not yet managed to do it.',
    vi_full: 'Tôi có một bất đồng với người thân hôm qua và dành phần lớn hôm nay mang theo gánh nặng đó mà không thể tập trung hoàn toàn vào bất cứ điều gì khác. Chúng tôi không la hét, nhưng những lời nói sắc bén hơn cần thiết, và tôi cứ phát lại cuộc trò chuyện trong đầu cố tìm ra nó đã trệch đi ở đâu. Tôi biết nên chủ động liên hệ và nói chuyện đúng đắn thay vì chờ đợi, nhưng chưa tìm được cách làm điều đó.',
  },
  {
    vi: 'Tôi đọc về thiên nhiên và nhận ra rằng mình thực sự không dành đủ thời gian ở ngoài trời dù thành phố của tôi có nhiều công viên.',
    en: 'I have been reading about the positive effects of spending time outdoors and realized with some guilt that despite living ten minutes from a large and beautiful park I rarely go there except to pass through it on my way somewhere else. The evidence for how much regular time in natural spaces improves mood and reduces anxiety is very convincing, and I have decided to make a deliberate habit of walking there at least twice a week, even for a short time.',
    vi_full: 'Tôi đọc về những tác động tích cực của việc dành thời gian ngoài trời và nhận ra với đôi chút tội lỗi rằng mặc dù sống cách một công viên lớn và đẹp mười phút, tôi hiếm khi đến đó trừ khi chỉ đi qua trên đường đến nơi khác. Bằng chứng về việc thời gian thường xuyên trong không gian tự nhiên cải thiện tâm trạng và giảm lo lắng rất thuyết phục, và tôi quyết định tạo thói quen đi bộ đến đó ít nhất hai lần mỗi tuần, dù chỉ một khoảng thời gian ngắn.',
  },
  {
    vi: 'Tôi được thăng chức hôm nay nhưng phản ứng đầu tiên của tôi là lo lắng thay vì vui mừng, điều đó khiến tôi suy nghĩ nhiều.',
    en: 'I was told today that I am being promoted, which I had been working toward for over a year, and my first feeling was not the excitement I expected but a quiet anxiety about whether I am actually ready for the new level of responsibility. I accepted graciously and celebrated appropriately with my colleagues, but on the bus home I felt more apprehensive than happy. I think this is not unusual, but I would very much like the confidence to catch up with the opportunity.',
    vi_full: 'Hôm nay tôi được thông báo được thăng chức, điều tôi đã hướng tới hơn một năm, và cảm giác đầu tiên không phải sự phấn khích như tôi kỳ vọng mà là một lo lắng yên lặng về việc tôi có thực sự sẵn sàng cho mức độ trách nhiệm mới không. Tôi nhận lời một cách lịch sự và ăn mừng phù hợp với đồng nghiệp, nhưng trên xe buýt về nhà tôi cảm thấy lo ngại hơn là vui mừng. Tôi nghĩ điều này không phải bất thường, nhưng tôi rất muốn sự tự tin theo kịp cơ hội.',
  },
  {
    vi: 'Tôi thử ngắt kết nối hoàn toàn khỏi công việc trong một ngày nghỉ và thấy việc thực sự nghỉ ngơi khó hơn mình nghĩ.',
    en: 'I took a day off work this week and made a deliberate decision not to check my work email even once. By eleven in the morning I had already unlocked my phone to open the app twice before stopping myself. The compulsion to stay connected is much stronger than I realized and seems to operate independently of whether there is actually anything urgent to attend to. I eventually managed a genuine break by the afternoon, which felt strange but ultimately very good.',
    vi_full: 'Tôi nghỉ làm một ngày tuần này và đưa ra quyết định có chủ ý không kiểm tra email công việc dù chỉ một lần. Đến mười một giờ sáng tôi đã mở khóa điện thoại để mở ứng dụng hai lần trước khi tự dừng lại. Sự thôi thúc phải luôn kết nối mạnh hơn tôi nhận ra và có vẻ hoạt động độc lập với việc có thực sự có điều gì khẩn cấp cần xử lý hay không. Cuối cùng tôi tìm được khoảng nghỉ thực sự vào buổi chiều, cảm thấy kỳ lạ nhưng rốt cuộc rất tốt.',
  },
  {
    vi: 'Tôi đến thư viện lần đầu tiên trong nhiều năm và thấy rằng mình đã bỏ lỡ nơi này rất nhiều.',
    en: 'I visited the public library for the first time in several years last Tuesday afternoon and was struck immediately by how much I had missed it. The smell of the books, the particular quality of the silence, the concentration visible on every person inside, all of it felt familiar and deeply welcome. I signed up for a new borrower card and left with four books under my arm, feeling lighter somehow than I had when I arrived.',
    vi_full: 'Tôi ghé thư viện công cộng lần đầu trong nhiều năm vào chiều Thứ Ba tuần trước và ngay lập tức ấn tượng bởi việc mình đã nhớ nó bao nhiêu. Mùi sách, chất lượng đặc biệt của sự im lặng, sự tập trung hiện rõ trên từng người bên trong, tất cả đều quen thuộc và thực sự chào đón. Tôi đăng ký thẻ mượn mới và rời đi với bốn cuốn sách dưới tay, cảm thấy nhẹ nhàng hơn bằng cách nào đó so với khi đến.',
  },
  {
    vi: 'Tôi nhận được một bức thư tay từ người bạn ở nước ngoài và không ngờ rằng một tờ giấy lại có thể mang lại cảm giác ấm áp đến vậy.',
    en: 'A handwritten letter arrived in the post yesterday from a friend who moved abroad eighteen months ago, and I sat down immediately to read it properly rather than standing in the hallway as I usually do with correspondence. There is a quality of attention in a handwritten letter that no digital message can replicate, a sense that the person chose each word carefully and gave up real time to write it. I am going to write back the same way.',
    vi_full: 'Một bức thư viết tay đến trong bưu phẩm hôm qua từ người bạn chuyển ra nước ngoài mười tám tháng trước, và tôi ngay lập tức ngồi xuống đọc đúng cách thay vì đứng trong hành lang như tôi thường làm với thư từ. Có một chất lượng chú ý trong thư viết tay mà không một tin nhắn số nào có thể sao chép được, cảm giác rằng người đó chọn từng từ cẩn thận và đã từ bỏ thời gian thực để viết. Tôi sẽ trả lời theo cách tương tự.',
  },
  {
    vi: 'Tôi thực hiện một thử thách nhỏ là cảm ơn một người mỗi ngày và thấy nó thay đổi cách tôi nhìn người xung quanh.',
    en: 'I started a small personal challenge three weeks ago where I make a point of genuinely thanking one specific person each day, not a routine pleasantry but a real acknowledgment of something they have done that I value. It has required me to pay much closer attention to the people around me, which has itself been the most interesting part of the exercise. I have noticed kindnesses and efforts that I think I was previously walking past without registering.',
    vi_full: 'Ba tuần trước tôi bắt đầu một thử thách cá nhân nhỏ là mỗi ngày thành thật cảm ơn một người cụ thể, không phải lời xã giao thông thường mà là sự thừa nhận thực sự về điều họ đã làm mà tôi trân trọng. Điều này đòi hỏi tôi phải chú ý nhiều hơn đến những người xung quanh, và đó chính là phần thú vị nhất của bài tập. Tôi đã nhận ra những hành động tốt và nỗ lực mà trước đây tôi nghĩ mình đã đi qua mà không để ý.',
  },
  {
    vi: 'Tôi quyết định học vẽ tuy chưa từng có năng khiếu, chỉ đơn giản là vì muốn thử thêm một điều gì đó mới.',
    en: 'I signed up for a beginner drawing class last week with no expectation of being good at it and no particular ambition beyond wanting to try something completely new with my hands. The first session was humbling in a useful way, and the instructor was patient with the group of awkward adults who had all apparently come for similar reasons. I left with a very imperfect sketch of a still life and a genuine desire to go back next week.',
    vi_full: 'Tuần trước tôi đăng ký lớp học vẽ cho người mới bắt đầu mà không kỳ vọng giỏi và không có tham vọng cụ thể nào ngoài việc muốn thử điều gì đó hoàn toàn mới với đôi tay. Buổi đầu tiên khiêm nhường theo cách hữu ích, và người hướng dẫn kiên nhẫn với nhóm người lớn vụng về có vẻ tất cả đều đến vì những lý do tương tự. Tôi rời đi với bản phác thảo vật tĩnh không hoàn hảo lắm và mong muốn thực sự được quay lại tuần tới.',
  },
  {
    vi: 'Tôi và đồng nghiệp tổ chức một buổi tiệc nhỏ cho người sắp nghỉ việc và nhận ra rằng mình sẽ thực sự nhớ người đó.',
    en: 'We organized a small leaving party at work this afternoon for a colleague who is moving on after four years with the company, and it was only when I stood up to say a few words about her that I fully appreciated how much I had valued working alongside her every day. Good colleagues are easy to take for granted when they are present and difficult to replace when they leave, and I made a mental note to tell people more regularly that I appreciate them.',
    vi_full: 'Chúng tôi tổ chức một buổi tiệc chia tay nhỏ ở công ty chiều nay cho một đồng nghiệp đang rời đi sau bốn năm, và chỉ khi tôi đứng dậy nói vài lời về cô ấy mới hoàn toàn trân trọng mình đã coi trọng việc làm cùng cô ấy hàng ngày đến mức nào. Đồng nghiệp tốt dễ bị coi là điều đương nhiên khi họ còn ở đó và khó thay thế khi họ rời đi, và tôi tự nhắc mình nói với mọi người thường xuyên hơn rằng tôi trân trọng họ.',
  },
  {
    vi: 'Tôi thức đến 2 giờ sáng không phải vì lo lắng mà chỉ vì không thể ngừng đọc cuốn sách đang cầm trên tay.',
    en: 'I was still awake at two in the morning last night not because of anxiety or restlessness but simply because I could not bring myself to put down the book I was reading. It had taken hold of me in the way that only the very best stories do, making the real world feel less real than the one on the page. I finished the last chapter in the early hours and lay there for a while in the pleasant daze that follows the end of a truly good book.',
    vi_full: 'Tôi vẫn thức lúc hai giờ sáng tối qua không phải vì lo lắng hay bồn chồn mà chỉ đơn giản vì không thể ép mình đặt xuống cuốn sách đang đọc. Nó nắm lấy tôi theo cách chỉ những câu chuyện hay nhất mới làm được, khiến thế giới thực cảm thấy kém thực hơn thế giới trên trang sách. Tôi đọc xong chương cuối trong những giờ sớm và nằm đó một lúc trong trạng thái mê mơ dễ chịu theo sau sự kết thúc của một cuốn sách thực sự hay.',
  },
  {
    vi: 'Tôi cảm thấy kiệt sức theo kiểu mà không phải giấc ngủ nào cũng có thể giải quyết được, đó là sự mệt mỏi tinh thần.',
    en: 'The tiredness I have been feeling this week is not the kind that sleep relieves, which is a different and more difficult problem to address. I wake up reasonably rested but by midday I find my concentration slipping and a flatness setting in that I cannot push through with caffeine or effort. I think I need a proper rest, not just a night of sleep but several consecutive days of reduced demands and genuine mental space, and I am trying to figure out how to create that.',
    vi_full: 'Sự mệt mỏi tôi cảm thấy tuần này không phải loại mà giấc ngủ chữa được, đó là một vấn đề khác và khó giải quyết hơn. Tôi thức dậy khá nghỉ ngơi nhưng đến buổi trưa thấy sự tập trung sụt giảm và một trạng thái bằng phẳng hình thành mà tôi không thể đẩy qua được bằng caffeine hay nỗ lực. Tôi nghĩ cần được nghỉ ngơi đúng nghĩa, không chỉ một đêm ngủ mà vài ngày liên tiếp giảm bớt đòi hỏi và có không gian tinh thần thực sự, và tôi đang cố tìm cách tạo ra điều đó.',
  },
  {
    vi: 'Tôi nói chuyện với mẹ qua điện thoại tối nay và như mọi lần, cuộc gọi ngắn hơn nhiều so với những gì tôi muốn.',
    en: 'I called my mother this evening and we talked for about forty minutes, which feels both long and not nearly long enough. She told me about the small events of her week, asked careful questions about mine, and reminded me of two things I had promised to send her weeks ago and completely forgotten. There is a particular warmth in these ordinary phone calls that I do not always appreciate properly in the moment, but always feel after I hang up.',
    vi_full: 'Tôi gọi điện cho mẹ tối nay và chúng tôi nói chuyện khoảng bốn mươi phút, cảm thấy vừa dài vừa không đủ dài. Bà kể về những sự kiện nhỏ trong tuần, hỏi thăm cẩn thận về tuần của tôi và nhắc tôi hai điều tôi đã hứa gửi cho bà từ nhiều tuần trước mà quên hoàn toàn. Có một sự ấm áp đặc biệt trong những cuộc gọi điện thoại bình thường này mà tôi không phải lúc nào cũng trân trọng đúng mức vào lúc đó, nhưng luôn cảm nhận sau khi cúp máy.',
  },
  {
    vi: 'Tôi bắt đầu đọc sách trước khi ngủ thay vì nhìn điện thoại và sự thay đổi đó đã ảnh hưởng tích cực đến giấc ngủ của tôi.',
    en: 'I switched from looking at my phone in bed to reading an actual book before sleeping about a month ago, partly out of curiosity and partly because I had read too many articles about the effects of screen light on sleep quality. The change has been genuinely noticeable. I fall asleep faster, sleep more deeply, and wake up with less of the mental fog that used to linger in the mornings. It is one of the easiest improvements I have made in a long time.',
    vi_full: 'Khoảng một tháng trước tôi chuyển từ nhìn điện thoại trên giường sang đọc sách thực sự trước khi ngủ, một phần vì tò mò và một phần vì đã đọc quá nhiều bài về tác động của ánh sáng màn hình đến chất lượng giấc ngủ. Sự thay đổi thực sự đáng chú ý. Tôi ngủ nhanh hơn, ngủ sâu hơn và thức dậy với ít sương mù tinh thần hơn so với trước kia. Đây là một trong những cải tiến dễ nhất tôi đã thực hiện từ lâu.',
  },
  {
    vi: 'Hôm nay tôi đứng trước gương lâu hơn bình thường và cố gắng nhìn bản thân mình với ánh mắt tử tế hơn.',
    en: 'I spent an unusual amount of time looking at myself in the mirror this morning and trying, consciously and with some effort, to replace my habitual critical assessment with something kinder. The running commentary in my head about everything I would like to change is so automatic that I barely notice it most days, but when I stop and listen to it properly the harshness is actually quite striking. I would not speak to a friend the way I speak to myself, and that inconsistency seems worth addressing.',
    vi_full: 'Sáng nay tôi dành thời gian bất thường nhìn vào gương và cố gắng, có ý thức và với một chút nỗ lực, thay thế đánh giá phê bình thói quen bằng điều gì đó tử tế hơn. Lời bình luận liên tục trong đầu về mọi thứ tôi muốn thay đổi quá tự động đến mức tôi hầu như không để ý hầu hết các ngày, nhưng khi dừng lại và lắng nghe đúng cách thì sự khắt khe thực sự khá nổi bật. Tôi sẽ không nói chuyện với bạn bè theo cách tôi nói với bản thân, và sự không nhất quán đó có vẻ đáng giải quyết.',
  },
  {
    vi: 'Tôi đã học được rằng xin lỗi không có nghĩa là mình sai — đôi khi nó có nghĩa là mình trân trọng mối quan hệ hơn là đúng.',
    en: 'I apologized to someone today for my part in a disagreement even though I still believe my original position was the more reasonable one. I did it not because I had changed my mind but because I realized that the relationship was more important to me than the principle involved, and that maintaining tension indefinitely over something relatively minor is a poor trade. It took more deliberate effort than I expected, and the relief on both sides afterward was immediate and genuine.',
    vi_full: 'Hôm nay tôi xin lỗi ai đó về phần của mình trong một bất đồng dù tôi vẫn tin lập trường ban đầu của mình hợp lý hơn. Tôi làm vậy không phải vì thay đổi suy nghĩ mà vì nhận ra rằng mối quan hệ quan trọng hơn với tôi so với nguyên tắc liên quan, và duy trì căng thẳng vô thời hạn vì điều gì đó tương đối nhỏ là một sự đánh đổi tệ. Cần nỗ lực có chủ ý hơn tôi nghĩ, và sự nhẹ nhõm từ cả hai phía sau đó là ngay lập tức và thực sự.',
  },
  {
    vi: 'Tôi đặt mục tiêu tiết kiệm tiền nghiêm túc hơn từ tháng này và cần phải thay đổi một số thói quen chi tiêu.',
    en: 'I sat down with a notebook this evening and worked out a proper budget for the first time in my adult life, tracking every category of spending and comparing it against my actual income. The results were illuminating in an uncomfortable way. I spend significantly more on food, both groceries and eating out, than I had estimated, and considerably less on things I claim to care about, like books and experiences. This mismatch between my spending and my stated priorities is something I intend to address.',
    vi_full: 'Tôi ngồi với một quyển sổ tối nay và lập ngân sách đúng đắn lần đầu tiên trong cuộc đời trưởng thành, theo dõi từng danh mục chi tiêu và so sánh với thu nhập thực tế. Kết quả soi sáng theo cách không thoải mái. Tôi chi nhiều hơn đáng kể cho thức ăn, cả tạp hóa và ăn ngoài, so với ước tính, và ít hơn nhiều cho những thứ tôi tuyên bố quan tâm như sách và trải nghiệm. Sự không khớp giữa chi tiêu và ưu tiên đã nêu là điều tôi dự định giải quyết.',
  },
  {
    vi: 'Tôi thấy mình hay mơ về những chuyến du lịch mà chưa biết bao giờ mới thực hiện được.',
    en: 'I have a habit of spending time planning trips I may never actually take, researching destinations in detail and building imaginary itineraries with the same care I would apply to a real journey. I am aware this is partly a form of escapism and partly genuine curiosity about places I would like to see, and I have decided these two motivations can coexist. The planning itself is pleasurable, and occasionally one of these imaginary trips becomes a real one.',
    vi_full: 'Tôi có thói quen dành thời gian lên kế hoạch những chuyến đi mà tôi có thể không bao giờ thực sự thực hiện, nghiên cứu điểm đến chi tiết và xây dựng lịch trình tưởng tượng với sự cẩn thận như tôi áp dụng cho một hành trình thực sự. Tôi biết điều này một phần là trốn thoát và một phần là sự tò mò thực sự về những nơi muốn thăm, và tôi quyết định hai động lực này có thể cùng tồn tại. Việc lên kế hoạch tự thân đã thú vị, và đôi khi một trong những chuyến đi tưởng tượng trở thành thực tế.',
  },
  {
    vi: 'Tôi thực hiện một ngày không tiêu tiền và ngạc nhiên khi thấy rằng mình hoàn toàn có thể sống được mà không cần mua gì.',
    en: 'I challenged myself to spend absolutely no money for one full day last week, something I have never consciously tried before. It required more planning than I expected, mainly in terms of food, but was otherwise not as difficult as I had assumed. What surprised me most was noticing how many times throughout the day I felt a small automatic impulse to buy something, not out of genuine need but out of habit or boredom. Simply observing those impulses without acting on them was very interesting.',
    vi_full: 'Tôi thách thức bản thân không tiêu một đồng nào trong một ngày đầy đủ tuần trước, điều tôi chưa bao giờ có ý thức thử trước. Cần lên kế hoạch nhiều hơn tôi kỳ vọng, chủ yếu về thức ăn, nhưng ngoài ra không khó như tôi giả định. Điều ngạc nhiên nhất là nhận thấy bao nhiêu lần trong ngày tôi cảm thấy một thôi thúc tự động nhỏ để mua thứ gì đó, không phải vì nhu cầu thực sự mà vì thói quen hay buồn chán. Chỉ quan sát những thôi thúc đó mà không hành động theo là rất thú vị.',
  },
  {
    vi: 'Tôi và người yêu cũ tình cờ gặp nhau ngoài phố và cuộc trò chuyện ngắn ngủi đó khiến tôi suy nghĩ mãi sau đó.',
    en: 'I ran into an ex-partner on the street this afternoon for the first time in two years and we stopped to exchange a few words in the way that people do in those circumstances, politely and with a slightly careful quality that did not used to be there. We wished each other well and went our separate ways after a few minutes, and I found myself thinking about the encounter for the rest of the day, not with sadness exactly, but with a thoughtful kind of awareness of time passing.',
    vi_full: 'Chiều nay tôi tình cờ gặp người bạn cũ trên phố lần đầu tiên sau hai năm và chúng tôi dừng lại trao đổi vài lời theo cách người ta làm trong hoàn cảnh đó, lịch sự và với chất lượng hơi cẩn thận trước đây không có. Chúng tôi chúc nhau điều tốt và chia đường sau vài phút, và tôi thấy mình suy nghĩ về cuộc gặp đó suốt phần còn lại của ngày, không hẳn là buồn, mà là một sự nhận thức suy nghĩ về thời gian trôi qua.',
  },
  {
    vi: 'Tôi nghe lại một bài hát cũ mà tôi từng nghe đi nghe lại trong một giai đoạn khó khăn và cảm xúc ùa về rất mạnh.',
    en: 'I heard a song today that I used to listen to repeatedly during a particularly hard period several years ago, and the emotional response was immediate and unexpectedly powerful. Music stores memories in a way that nothing else quite matches, bypassing conscious recall and delivering the feeling directly. I sat with it for a while rather than skipping ahead, because even difficult memories, when they are sufficiently distant, carry something worth feeling again briefly.',
    vi_full: 'Hôm nay tôi nghe một bài hát mà tôi từng nghe lặp đi lặp lại trong một giai đoạn khó khăn đặc biệt nhiều năm trước, và phản ứng cảm xúc là ngay lập tức và bất ngờ mạnh mẽ. Âm nhạc lưu giữ ký ức theo cách không gì khác sánh được, vượt qua hồi ức có ý thức và mang lại cảm giác trực tiếp. Tôi ngồi với nó một lúc thay vì bỏ qua, vì ngay cả những ký ức khó khăn, khi đã đủ xa, cũng mang điều gì đó đáng cảm nhận lại một lúc.',
  },
  {
    vi: 'Tôi đi khám sức khỏe định kỳ hôm nay và nhắc nhở bản thân rằng việc chăm sóc cơ thể là một hành động tự yêu thương.',
    en: 'I had a routine health check-up today, something I had been putting off for nearly a year despite knowing I should not. Everything came back normal, which was reassuring, but the more important thing was simply the act of going. Taking care of your body requires a kind of regular attention that is easy to defer when you feel reasonably well, and I am trying to get better at not waiting for something to be wrong before I pay it some consideration.',
    vi_full: 'Hôm nay tôi kiểm tra sức khỏe định kỳ, điều tôi đã trì hoãn gần một năm dù biết không nên. Mọi thứ đều bình thường, điều đó yên tâm, nhưng điều quan trọng hơn đơn giản là hành động đến khám. Chăm sóc cơ thể đòi hỏi một loại chú ý thường xuyên dễ bị hoãn lại khi bạn cảm thấy khá ổn, và tôi đang cố gắng không chờ đến khi có gì sai mới để ý đến nó.',
  },
  {
    vi: 'Tôi tham gia câu lạc bộ đọc sách lần đầu tiên tối nay và thấy rằng nghe người khác nói về sách cũng thú vị không kém đọc.',
    en: 'I attended my first book club meeting this evening, joining a small group of people who gather monthly to discuss whatever they have all been reading. I was the newest member and felt slightly self-conscious at first, but the conversation was immediately engaging and I found perspectives on the book I would never have arrived at on my own. Discussing literature with people who have genuinely thought about it is a pleasure I had forgotten, and I plan to go every month.',
    vi_full: 'Tôi tham dự buổi họp câu lạc bộ đọc sách đầu tiên tối nay, tham gia một nhóm nhỏ người tụ họp hàng tháng để thảo luận về bất cứ cuốn sách nào họ đang đọc. Tôi là thành viên mới nhất và lúc đầu hơi tự ti, nhưng cuộc trò chuyện ngay lập tức hấp dẫn và tôi tìm thấy những quan điểm về cuốn sách mà tôi sẽ không bao giờ đến được một mình. Thảo luận văn học với người đã thực sự suy nghĩ về nó là niềm vui tôi đã quên, và tôi dự định đến mỗi tháng.',
  },
  {
    vi: 'Hôm nay trời nổi cơn bão bất ngờ khi tôi đang ở ngoài đường và tôi không mang ô — đó là một trong những khoảnh khắc bất ngờ thú vị.',
    en: 'A sudden and heavy rainstorm caught me on the street this afternoon with no umbrella and no shelter nearby for several minutes. I gave up very quickly on trying to stay dry and walked the remaining distance to the coffee shop I was heading for in the rain, arriving completely soaked to some amusement from the people inside. There is a particular freedom in being thoroughly wet already that removes all the usual anxiety about rain, and the coffee I ordered afterward tasted unusually good.',
    vi_full: 'Một cơn mưa to bất ngờ bắt gặp tôi trên phố chiều nay không có ô và không có nơi trú ẩn gần đó trong vài phút. Tôi từ bỏ rất nhanh việc cố giữ khô người và đi bộ quãng đường còn lại đến quán cà phê đang hướng đến trong mưa, đến nơi ướt sũng khiến mọi người bên trong khá buồn cười. Có một sự tự do đặc biệt khi đã ướt hoàn toàn rồi, loại bỏ toàn bộ lo lắng thường thấy về mưa, và tách cà phê tôi gọi sau đó ngon một cách bất thường.',
  },
  {
    vi: 'Tôi học cách nói không mà không cần xin lỗi dài dòng và nhận ra đây là một kỹ năng quan trọng.',
    en: 'I have been practicing saying no to requests in a cleaner and more direct way, without the lengthy explanations and apologies that I usually pile on top as cushioning. The habit of over-explaining a refusal comes from wanting to be liked and not wanting to seem unhelpful, but it usually makes the whole interaction more awkward for everyone rather than less. A simple, kind, clear no is something I am actively working on and finding harder than it should be.',
    vi_full: 'Tôi đang thực hành nói không với các yêu cầu theo cách sạch hơn và trực tiếp hơn, không có những giải thích dài dòng và lời xin lỗi mà tôi thường chồng thêm làm đệm. Thói quen giải thích quá nhiều một lời từ chối đến từ việc muốn được yêu thích và không muốn có vẻ không giúp ích, nhưng thường làm cho toàn bộ tương tác trở nên khó xử hơn cho mọi người thay vì ít hơn. Một cái không đơn giản, tử tế, rõ ràng là điều tôi đang tích cực thực hành và thấy khó hơn mức cần thiết.',
  },
  {
    vi: 'Tôi cảm thấy tự hào khi nhìn lại hành trình của mình một năm trước — tôi đã đi được rất xa.',
    en: 'I spent some time this evening looking back through messages and notes from around a year ago, and was struck by how different my circumstances and state of mind were at that point. I was dealing with things then that felt very large and uncertain, and while not all of them have fully resolved, many of them have, and I have grown considerably in how I handle what has not. Progress is rarely obvious while you are inside it, but looking back makes it very clear.',
    vi_full: 'Tôi dành một chút thời gian tối nay nhìn lại qua các tin nhắn và ghi chú từ khoảng một năm trước, và ấn tượng bởi hoàn cảnh và trạng thái tâm trí của tôi khác nhau đến thế nào vào lúc đó. Khi đó tôi đang đối mặt với những thứ cảm thấy rất lớn và không chắc, và dù không phải tất cả đều đã hoàn toàn giải quyết, nhiều thứ đã, và tôi đã trưởng thành đáng kể trong cách xử lý những gì chưa. Tiến bộ hiếm khi rõ ràng khi bạn đang ở trong đó, nhưng nhìn lại thì rất rõ.',
  },
  {
    vi: 'Tôi thấy cảm hứng học tiếng Anh lại bùng lên sau khi xem được một bộ phim hay bằng tiếng Anh không có phụ đề.',
    en: 'I watched a film in English without subtitles last night, something I try to do occasionally to keep myself honest about my comprehension level, and found that I understood considerably more than I had the last time I tried it a year ago. There were still moments where I lost the thread of a conversation or missed a cultural reference, but the overall experience was much more manageable and enjoyable than before. Small measurable signs of actual progress are deeply motivating.',
    vi_full: 'Tối qua tôi xem một bộ phim tiếng Anh không có phụ đề, điều tôi cố gắng thỉnh thoảng làm để tự kiểm tra mức độ hiểu của mình, và thấy rằng tôi hiểu nhiều hơn đáng kể so với lần cuối thử một năm trước. Vẫn còn những khoảnh khắc mất đuôi cuộc trò chuyện hay bỏ lỡ tham chiếu văn hóa, nhưng trải nghiệm tổng thể dễ quản lý và thú vị hơn nhiều so với trước. Những dấu hiệu nhỏ có thể đo được của tiến bộ thực sự là rất tạo động lực.',
  },
  {
    vi: 'Tôi thích ngồi nghe mưa từ bên trong và cảm giác đó khiến tôi bình yên theo cách không thứ gì khác làm được.',
    en: 'Rain has been falling steadily since mid-afternoon and I have spent the last hour sitting near the window listening to it without doing anything else in particular. There is a quality of sound that rain makes against windows and pavement that I find more calming than any music, a white noise that seems to lower the entire ambient level of urgency and remind me that not everything requires my immediate attention. I have no desire whatsoever to be anywhere else this evening.',
    vi_full: 'Mưa rơi đều đặn từ giữa buổi chiều và tôi dành một tiếng qua ngồi gần cửa sổ lắng nghe mà không làm gì đặc biệt khác. Có một chất lượng âm thanh mà mưa tạo ra trên cửa sổ và vỉa hè mà tôi thấy bình tĩnh hơn bất kỳ âm nhạc nào, một tiếng ồn trắng có vẻ hạ thấp toàn bộ mức độ khẩn cấp xung quanh và nhắc tôi rằng không phải mọi thứ đều cần sự chú ý ngay lập tức. Tôi không mong muốn gì hơn là được ở đây tối nay.',
  },
  {
    vi: 'Tôi quyết định viết thư tay cho bố tôi nhân dịp sinh nhật ông thay vì chỉ gửi một tin nhắn ngắn như mọi năm.',
    en: 'My father birthday is next week and I decided this year to write him a proper handwritten letter rather than sending the short message I usually manage. I sat down to write it tonight and found it unexpectedly difficult not because I did not know what to say but because putting genuine feelings into words for a parent feels vulnerable in a way that a text message does not. I wrote three drafts before arriving at something honest and warm that I am satisfied with.',
    vi_full: 'Sinh nhật bố tôi tuần sau và năm nay tôi quyết định viết một bức thư tay đúng nghĩa thay vì gửi tin nhắn ngắn như thường lệ. Tôi ngồi xuống viết tối nay và thấy khó khăn bất ngờ không phải vì không biết nói gì mà vì đặt những cảm xúc thực sự vào lời nói cho cha mẹ cảm thấy dễ tổn thương theo cách tin nhắn không làm được. Tôi viết ba bản nháp trước khi đến được điều gì đó thành thật và ấm áp mà tôi hài lòng.',
  },
  {
    vi: 'Tôi trải qua một ngày mà mọi thứ đều diễn ra trơn tru và nhận ra rằng những ngày bình thường như vậy thực ra rất đáng trân trọng.',
    en: 'Yesterday was one of those days where nothing went wrong, nothing required extra effort or difficult decisions, and everything happened roughly as it was supposed to. I got my work done, had a pleasant lunch, came home at a reasonable hour, and slept well. These unremarkable days feel invisible while they are happening but in retrospect I think they are the foundation of a good life, and I am making more of an effort to appreciate them rather than just passing through them.',
    vi_full: 'Hôm qua là một trong những ngày không có gì sai, không có gì đòi hỏi nỗ lực thêm hay quyết định khó, và mọi thứ diễn ra đúng như nó lẽ ra phải. Tôi hoàn thành công việc, ăn trưa dễ chịu, về nhà vào giờ hợp lý và ngủ ngon. Những ngày không có gì đặc biệt này cảm thấy vô hình khi đang xảy ra nhưng nhìn lại tôi nghĩ chúng là nền tảng của một cuộc sống tốt, và tôi đang cố gắng hơn để trân trọng chúng thay vì chỉ đi qua.',
  },
  {
    vi: 'Tôi bắt đầu dậy sớm hơn ba mươi phút mỗi sáng và khám phá ra rằng buổi sáng yên tĩnh đó thay đổi cả ngày của mình.',
    en: 'I have been setting my alarm thirty minutes earlier than usual for the past two weeks, and the extra time in the quiet morning before the day officially starts has changed how the rest of the day unfolds in a way I did not anticipate. I use the time to sit with tea, think without interruption, and write a few lines about what I want to focus on. I arrive at my work feeling like I have already been awake long enough to be ready for it.',
    vi_full: 'Hai tuần qua tôi đặt đồng hồ báo sớm hơn ba mươi phút so với bình thường, và thời gian thêm trong buổi sáng yên tĩnh trước khi ngày bắt đầu chính thức đã thay đổi cách phần còn lại của ngày diễn ra theo cách tôi không dự đoán. Tôi dùng thời gian đó ngồi uống trà, suy nghĩ mà không bị gián đoạn và viết vài dòng về điều muốn tập trung. Tôi đến chỗ làm với cảm giác đã thức đủ lâu để sẵn sàng.',
  },
  {
    vi: 'Tôi nhận ra rằng mình thường xuyên so sánh bản thân với người khác và điều đó đang âm thầm làm tôi không hạnh phúc.',
    en: 'I caught myself comparing my life to someone else again today, looking at what they have achieved and feeling a familiar twinge of inadequacy that I immediately recognized and disliked in myself. The comparison was neither fair nor useful, based on visible surface details of another person life against the full interior knowledge of my own. I know this intellectually but the habit persists anyway, and working to reduce it requires catching it each time it happens and deliberately redirecting my attention.',
    vi_full: 'Hôm nay tôi lại bắt gặp mình so sánh cuộc sống với người khác, nhìn vào những gì họ đã đạt được và cảm thấy cơn nhức quen thuộc về sự không đủ mà tôi ngay lập tức nhận ra và không thích trong bản thân. Sự so sánh không công bằng cũng không hữu ích, dựa trên các chi tiết bề mặt có thể nhìn thấy của cuộc đời người khác so với hiểu biết nội tâm đầy đủ về cuộc sống của chính mình. Tôi biết điều này về mặt lý trí nhưng thói quen vẫn dai dẳng, và việc giảm nó đòi hỏi bắt gặp mỗi lần nó xảy ra và chủ động chuyển hướng sự chú ý.',
  },
  {
    vi: 'Tôi đi siêu thị mà không có danh sách mua sắm và hối hận điều đó ngay khi về đến nhà.',
    en: 'I went to the supermarket this evening without making a shopping list first, which I know from long experience is always a mistake. I bought seven things I did not need, forgot at least four things I specifically went for, and spent significantly more money than I usually do. The predictable result of predictable behavior is never very surprising, and yet I continue to make this particular error at intervals of about three weeks and probably will do so indefinitely.',
    vi_full: 'Tối nay tôi đi siêu thị mà không làm danh sách mua sắm trước, điều tôi biết từ kinh nghiệm lâu dài là luôn luôn là sai lầm. Tôi mua bảy thứ không cần, quên ít nhất bốn thứ cụ thể đã đi để mua, và chi nhiều tiền hơn bình thường đáng kể. Kết quả có thể đoán được của hành vi có thể đoán trước không bao giờ đáng ngạc nhiên lắm, nhưng tôi vẫn tiếp tục mắc sai lầm cụ thể này cứ khoảng ba tuần một lần và có lẽ sẽ làm vậy vô thời hạn.',
  },
  {
    vi: 'Tôi quyết định không mang điện thoại khi đi ăn tối với bạn bè và bữa ăn đó trở nên thật sự trọn vẹn hơn.',
    en: 'I deliberately left my phone at home when I went out for dinner with friends last night, which I have not done in years, and the difference in the quality of the evening was noticeable. I was fully present in a way that is harder to achieve when a phone is sitting on the table as a constant low-level temptation. My friends also seemed to relax more, and the conversation went to places it might not have reached if any of us had been half elsewhere.',
    vi_full: 'Tôi cố tình để điện thoại ở nhà khi đi ăn tối với bạn bè tối qua, điều tôi chưa làm nhiều năm, và sự khác biệt về chất lượng buổi tối rõ rệt. Tôi hiện diện hoàn toàn theo cách khó đạt được hơn khi có điện thoại trên bàn như một cám dỗ liên tục ở mức thấp. Bạn bè tôi cũng có vẻ thoải mái hơn, và cuộc trò chuyện đi đến những nơi có thể không đến được nếu bất kỳ ai trong chúng tôi đang ở nửa người nơi khác.',
  },
  {
    vi: 'Hôm nay tôi ngồi viết ra những điều mình muốn trong năm tới và thấy rằng danh sách đó ngắn hơn những năm trước nhiều.',
    en: 'I sat down today to write out what I actually want for the coming year, not resolutions in the traditional sense but a genuine attempt to identify what matters to me right now. I was surprised by how short the list was compared to previous years. I used to fill pages with ambitions and targets. This year the list has only five items, all of them specific and all of them connected to things I am already doing rather than things I think I should want.',
    vi_full: 'Hôm nay tôi ngồi xuống viết ra những gì tôi thực sự muốn cho năm tới, không phải những quyết tâm theo nghĩa truyền thống mà là nỗ lực thực sự xác định điều quan trọng với tôi lúc này. Tôi ngạc nhiên vì danh sách ngắn như thế nào so với những năm trước. Tôi đã từng điền đầy trang với tham vọng và mục tiêu. Năm nay danh sách chỉ có năm mục, tất cả đều cụ thể và tất cả đều liên quan đến những thứ tôi đang làm thay vì những thứ tôi nghĩ mình nên muốn.',
  },
  {
    vi: 'Tôi mất chìa khóa nhà và phải mất ba tiếng mới giải quyết xong, điều đó nhắc nhở tôi biết ơn những ngày bình thường.',
    en: 'I lost my house key this morning and spent three hours dealing with the consequences, including a locksmith, a temporary arrangement with a neighbor, and the underlying anxiety of not knowing where the key actually was. By the time everything was sorted out I felt disproportionately worn out for what was objectively a minor inconvenience. Small logistical disasters like this are useful reminders of how smoothly most days run and how little we acknowledge that fact.',
    vi_full: 'Sáng nay tôi mất chìa khóa nhà và dành ba tiếng xử lý hậu quả, bao gồm thợ khóa, sắp xếp tạm thời với hàng xóm và lo lắng nền tảng về việc không biết chìa khóa thực sự ở đâu. Khi mọi thứ được giải quyết tôi cảm thấy kiệt sức không tương xứng với điều khách quan là bất tiện nhỏ. Những thảm họa hậu cần nhỏ như thế này là lời nhắc nhở hữu ích về việc hầu hết các ngày diễn ra trơn tru như thế nào và chúng ta ít thừa nhận điều đó đến mức nào.',
  },
  {
    vi: 'Tôi học được rằng im lặng trong cuộc trò chuyện không phải lúc nào cũng là sự khó chịu — đôi khi đó là sự kết nối sâu sắc.',
    en: 'I noticed something during a long conversation with a close friend this week that I want to remember. We sat in silence for several minutes at one point, not because we had run out of things to say but because what had just been said felt complete and did not need to be followed immediately by more words. I am normally uncomfortable with conversational silence and instinctively rush to fill it, but this time I let it be and found it was not empty at all.',
    vi_full: 'Tuần này trong một cuộc trò chuyện dài với người bạn thân tôi nhận thấy điều gì đó muốn nhớ. Chúng tôi ngồi im lặng vài phút ở một thời điểm, không phải vì hết chuyện nói mà vì những gì vừa được nói cảm thấy hoàn chỉnh và không cần được tiếp nối ngay bằng nhiều lời hơn. Thông thường tôi không thoải mái với sự im lặng trong trò chuyện và theo bản năng vội vàng lấp đầy nó, nhưng lần này tôi để nó như vậy và thấy nó không hề trống rỗng.',
  },
  {
    vi: 'Tôi tự nấu bữa sáng đẹp mắt cho bản thân mình vào một ngày cuối tuần và hành động đó nhỏ thôi nhưng khiến tôi hạnh phúc.',
    en: 'I made a proper breakfast for myself on Sunday morning, eggs cooked carefully with herbs from the windowsill, toast with good butter, a small glass of orange juice, all arranged nicely on a real plate rather than eaten standing over the sink as I usually do on weekdays. I sat at the table and ate it slowly without reading anything. It was a small act of self-regard that cost very little and produced a disproportionate amount of contentment.',
    vi_full: 'Sáng Chủ Nhật tôi tự nấu bữa sáng đúng cách cho mình, trứng nấu cẩn thận với rau thơm từ bệ cửa sổ, bánh mì nướng với bơ ngon, một ly nước cam nhỏ, tất cả được bày đẹp trên đĩa thực sự thay vì ăn đứng bên bồn rửa như tôi thường làm vào ngày thường. Tôi ngồi ở bàn và ăn chậm rãi mà không đọc gì. Đó là một hành động tự trân trọng bản thân nhỏ tốn rất ít và tạo ra lượng hài lòng không tương xứng.',
  },
  {
    vi: 'Tôi đang cố gắng tập thói quen phản ánh lại mỗi cuối ngày để hiểu hơn về bản thân và những gì mình thực sự muốn.',
    en: 'I have started ending each day with ten minutes of quiet reflection rather than falling immediately into whatever evening distraction is available, and after three weeks I can say this practice is changing how I move through my days. I notice more, I feel less reactive, and I am arriving at the end of each week with a clearer sense of what actually happened in it and how I felt about the various things that occurred. It is a small investment with a surprising return.',
    vi_full: 'Tôi bắt đầu kết thúc mỗi ngày với mười phút suy ngẫm yên tĩnh thay vì ngay lập tức sa vào bất kỳ sự giải trí nào có sẵn vào buổi tối, và sau ba tuần tôi có thể nói thực hành này đang thay đổi cách tôi đi qua các ngày. Tôi chú ý nhiều hơn, cảm thấy ít phản ứng hơn, và đến cuối mỗi tuần với cảm giác rõ ràng hơn về những gì thực sự xảy ra trong đó và cảm giác của tôi về các sự kiện khác nhau. Đây là một đầu tư nhỏ với kết quả đáng ngạc nhiên.',
  },
  {
    vi: 'Tôi tình cờ chứng kiến một khoảnh khắc đẹp trên đường về nhà và nó khiến tôi mỉm cười một mình.',
    en: 'I saw something on my walk home this evening that has stayed with me pleasantly. A very old man was sitting on a bench outside his building, and a small child who appeared to be his grandchild was showing him something on a leaf with great seriousness, holding it up and explaining while the man listened with complete and undivided attention. I walked past slowly and neither of them looked up. It was entirely ordinary and completely lovely.',
    vi_full: 'Tối nay trên đường về nhà tôi nhìn thấy điều gì đó ở lại với tôi một cách dễ chịu. Một cụ ông rất già đang ngồi trên ghế ngoài tòa nhà, và một đứa trẻ nhỏ có vẻ là cháu đang chỉ cho ông thứ gì đó trên một chiếc lá rất nghiêm túc, giơ lên và giải thích trong khi ông lắng nghe với sự chú ý hoàn toàn và không chia. Tôi đi qua chậm rãi và không ai nhìn lên. Đó hoàn toàn là điều bình thường và hoàn toàn đáng yêu.',
  },
  {
    vi: 'Tôi dọn đống quần áo cũ và quyên góp những thứ không còn dùng, cảm giác như trút bỏ được một gánh nặng nho nhỏ.',
    en: 'I spent this afternoon sorting through my wardrobe and filling three large bags with clothes I have not worn in over a year to donate to charity. The process took longer than expected because every item prompted a moment of consideration, and some of them prompted a small but real feeling of guilt about money spent badly. By the end the wardrobe looked orderly and half-empty in a satisfying way, and I left the donation bags by the door feeling genuinely lighter.',
    vi_full: 'Chiều nay tôi dành thời gian phân loại quần áo và đổ đầy ba túi lớn với quần áo không mặc hơn một năm để quyên góp từ thiện. Quá trình mất nhiều thời gian hơn dự kiến vì mỗi món đồ thúc đẩy một khoảnh khắc cân nhắc, và một số tạo ra cảm giác tội lỗi nhỏ nhưng thực sự về tiền chi tiêu không tốt. Cuối cùng tủ quần áo trông gọn gàng và rỗng một nửa theo cách thỏa mãn, và tôi để túi quyên góp bên cửa với cảm giác thực sự nhẹ nhàng hơn.',
  },
  {
    vi: 'Tôi nhận được lời khen từ người mà tôi kính trọng và không biết phản ứng như thế nào vì tôi không quen được khen.',
    en: 'Someone whose opinion I respect very highly paid me a genuine compliment about my work today, and I did not handle it well. Instead of simply saying thank you and accepting it gracefully, I deflected it with some self-deprecating qualifier that probably undermined what they were trying to say. I noticed this happening while it was happening but could not stop it, which suggests that receiving praise is something I need to practice as much as anything else.',
    vi_full: 'Hôm nay ai đó mà tôi rất kính trọng ý kiến đã tặng tôi lời khen thực sự về công việc, và tôi không xử lý tốt. Thay vì đơn giản nói cảm ơn và nhận nó một cách duyên dáng, tôi né tránh bằng một cụm từ tự ti có lẽ đã phá hoại những gì họ đang cố gắng nói. Tôi nhận thấy điều này đang xảy ra trong khi nó đang xảy ra nhưng không thể dừng lại, điều đó cho thấy nhận lời khen là điều tôi cần thực hành cũng nhiều như bất cứ điều gì khác.',
  },
  {
    vi: 'Mùa đông năm nay đến sớm hơn mọi năm và tôi chưa kịp chuẩn bị tâm lý lẫn quần áo cho nó.',
    en: 'Winter arrived considerably earlier than expected this year, dropping from pleasant autumn temperatures to genuine cold over the course of about four days. I was not ready for it in any sense, having failed to swap my wardrobe, buy the heavier bedding I had been meaning to get, or emotionally prepare for the months of short days ahead. I spent the first genuinely cold morning slightly grumpy, which I accept as a personal failing since the weather was doing exactly what it always does.',
    vi_full: 'Mùa đông năm nay đến sớm hơn dự kiến đáng kể, từ nhiệt độ mùa thu dễ chịu xuống lạnh thực sự trong khoảng bốn ngày. Tôi không sẵn sàng theo bất kỳ nghĩa nào, không thay quần áo theo mùa, không mua chăn dày hơn đang định mua, hay chuẩn bị tâm lý cho những tháng ngày ngắn sắp tới. Tôi trải qua buổi sáng lạnh thực sự đầu tiên với tâm trạng hơi cáu kỉnh, điều tôi chấp nhận là một lỗi cá nhân vì thời tiết đang làm đúng những gì nó luôn làm.',
  },
  {
    vi: 'Tôi cố gắng ít phán xét người khác hơn và nhận ra rằng khi mình ít phán xét người khác thì cũng bớt tự phán xét mình hơn.',
    en: 'I have been making a conscious effort to judge people less quickly, to wait for more information before forming an opinion and to hold whatever opinion I arrive at a little more loosely. What I have noticed, unexpectedly, is that the same mental habit that generates quick judgments about other people is the same one that generates harsh judgments about myself, and that softening one seems to soften the other. I cannot tell yet whether this is cause and effect or simply correlation.',
    vi_full: 'Tôi đã nỗ lực có ý thức để đánh giá người khác ít nhanh hơn, chờ đợi thêm thông tin trước khi hình thành ý kiến và giữ bất kỳ ý kiến nào tôi đến được một cách lỏng hơn một chút. Điều tôi nhận thấy bất ngờ là thói quen tâm trí tạo ra các phán xét nhanh về người khác cũng là thói quen tạo ra các phán xét khắt khe về bản thân, và việc làm mềm một cái có vẻ làm mềm cái kia. Tôi chưa thể nói đây là nguyên nhân và hệ quả hay chỉ đơn giản là mối tương quan.',
  },
  {
    vi: 'Tôi cảm thấy hạnh phúc hôm nay mà không có lý do rõ ràng nào, và tôi quyết định không cần tìm lý do cho điều đó.',
    en: 'I woke up this morning feeling genuinely and unreasonably happy for no particular reason that I could identify. The weather was ordinary, nothing special was planned, and I had no exceptional news. I spent the morning in a mild and pleasant state of contentment that required no explanation and was not made better or worse by my attempts to understand it. I have decided that happiness which arrives without being earned or caused is worth accepting gratefully and without analysis.',
    vi_full: 'Sáng nay tôi thức dậy cảm thấy thực sự và vô lý hạnh phúc không vì lý do cụ thể nào tôi có thể xác định. Thời tiết bình thường, không có gì đặc biệt được lên kế hoạch, và tôi không có tin tức đặc biệt nào. Tôi dành buổi sáng trong trạng thái hài lòng nhẹ nhàng và dễ chịu không cần giải thích và không được làm tốt hơn hay tệ hơn bởi các nỗ lực của tôi để hiểu nó. Tôi quyết định rằng hạnh phúc đến mà không được kiếm hay gây ra xứng đáng được chấp nhận với lòng biết ơn và không cần phân tích.',
  },
  {
    vi: 'Tôi tự nhắc nhở bản thân rằng việc không biết mình muốn gì cũng là thông tin quan trọng về bản thân.',
    en: 'I have been sitting with a feeling of uncertainty about a particular direction in my life and have been frustrated with myself for not having a clearer answer. A friend suggested that not knowing what you want is itself useful information rather than a failure or a gap to be filled as quickly as possible. I am trying to take that suggestion seriously and resist the pressure to decide before I actually understand what I am deciding between.',
    vi_full: 'Tôi đang ngồi với cảm giác không chắc chắn về một hướng đi cụ thể trong cuộc sống và thất vọng với bản thân vì không có câu trả lời rõ ràng hơn. Một người bạn gợi ý rằng không biết mình muốn gì tự thân là thông tin hữu ích thay vì là thất bại hay khoảng trống cần lấp đầy nhanh nhất có thể. Tôi đang cố gắng nghiêm túc với gợi ý đó và chống lại áp lực quyết định trước khi thực sự hiểu mình đang quyết định giữa cái gì.',
  },
  {
    vi: 'Tôi ngủ trưa ngoài ý muốn và thức dậy không biết mình đang ở đâu trong vài giây — đó là cảm giác kỳ lạ nhất trong ngày.',
    en: 'I fell asleep accidentally on the sofa this afternoon and woke up after about an hour completely disoriented, uncertain for several seconds what time of day it was or even which day of the week. The light had changed and the room had gone quiet in the way that rooms do in the late afternoon, and I lay there for a moment suspended between sleep and full wakefulness in a state that was genuinely strange. I do not nap intentionally but these accidental ones have their own unusual texture.',
    vi_full: 'Chiều nay tôi ngủ quên trên ghế sofa và thức dậy sau khoảng một tiếng hoàn toàn mất phương hướng, không chắc trong vài giây lúc đó là mấy giờ hay thậm chí ngày nào trong tuần. Ánh sáng đã thay đổi và căn phòng trở nên yên tĩnh theo cách các phòng hay làm vào cuối buổi chiều, và tôi nằm đó một lúc treo lơ lửng giữa giấc ngủ và tỉnh hoàn toàn trong trạng thái thực sự kỳ lạ. Tôi không ngủ trưa có chủ ý nhưng những giấc ngủ ngẫu nhiên này có kết cấu bất thường riêng của chúng.',
  },
  {
    vi: 'Tôi giúp một người lạ trên đường và khoảnh khắc nhỏ bé đó làm tôi cảm thấy vui cả ngày.',
    en: 'I helped a stranger this afternoon, someone who was struggling with a large and awkward box on the steps outside a building and clearly needed another pair of hands. It took me about four minutes and required nothing except a willingness to stop and offer. The woman thanked me with disproportionate warmth and I walked away feeling quietly good about the interaction in a way that lingered for several hours. Small acts of usefulness have a surprisingly large emotional return.',
    vi_full: 'Chiều nay tôi giúp một người lạ, ai đó đang vật lộn với hộp lớn và khó mang trên bậc thềm ngoài tòa nhà và rõ ràng cần thêm một đôi tay. Mất khoảng bốn phút và không đòi hỏi gì ngoài sự sẵn lòng dừng lại và đề nghị. Người phụ nữ cảm ơn tôi với sự ấm áp không tương xứng và tôi bước đi cảm thấy yên lặng tốt đẹp về tương tác theo cách kéo dài vài tiếng. Những hành động hữu ích nhỏ có lợi nhuận cảm xúc đáng ngạc nhiên lớn.',
  },
  {
    vi: 'Tôi thử nói chuyện với hàng xóm lần đầu tiên sau nhiều tháng sống kề cận mà không biết tên nhau.',
    en: 'I finally introduced myself properly to the neighbor I have been sharing a floor with for eight months, knowing nothing about him except the rough schedule of his comings and goings inferred from hallway sounds. We spoke for about ten minutes by the lift and I discovered he is a quietly interesting person with work that has taken him to many countries. I had spent months being incurious and slightly avoidant when a brief conversation was all that was ever required.',
    vi_full: 'Cuối cùng tôi giới thiệu bản thân đúng cách với người hàng xóm đã chia sẻ tầng với nhau tám tháng, không biết gì về anh ấy ngoài lịch trình ra vào sơ lược suy ra từ tiếng động hành lang. Chúng tôi nói chuyện khoảng mười phút bên thang máy và tôi khám phá ra anh ấy là người thú vị một cách yên lặng với công việc đã đưa anh đến nhiều quốc gia. Tôi đã dành tháng không tò mò và hơi né tránh trong khi một cuộc trò chuyện ngắn là tất cả những gì cần thiết.',
  },
  {
    vi: 'Tôi thử học đàn piano thông qua app trên điện thoại và mặc dù biết đó không phải cách tốt nhất nhưng vẫn thấy vui.',
    en: 'I downloaded a piano learning app this week and have been sitting at the keyboard my friend left at my apartment for five or ten minutes each evening, tapping through basic exercises with one finger and occasionally two. It is a slow and modest beginning and I am under no illusions about where it will lead, but the act of producing deliberate musical sounds, even very simple ones, is more engaging than I expected. I will see how long I keep it up.',
    vi_full: 'Tuần này tôi tải xuống ứng dụng học piano và ngồi ở bàn phím người bạn để lại tại căn hộ năm đến mười phút mỗi buổi tối, gõ qua các bài tập cơ bản với một ngón tay và đôi khi hai ngón. Đây là sự bắt đầu chậm chạp và khiêm tốn và tôi không ảo tưởng về hướng nó sẽ dẫn, nhưng hành động tạo ra những âm thanh âm nhạc có chủ đích, dù rất đơn giản, hấp dẫn hơn tôi kỳ vọng. Tôi sẽ xem mình duy trì được bao lâu.',
  },
  {
    vi: 'Tôi chụp ảnh lần đầu tiên bằng máy ảnh thực sự thay vì điện thoại và thấy đó là một trải nghiệm hoàn toàn khác.',
    en: 'I borrowed a proper camera from a friend this weekend and spent a few hours walking around the city taking photographs with it instead of my phone. The experience of photography changes completely when you cannot take thirty pictures in ten seconds and choose the best one later. Each shot requires actual thought about framing and light, and the resulting pictures, even the unsuccessful ones, feel more considered. I understand better now why some people are serious about it as a practice.',
    vi_full: 'Cuối tuần này tôi mượn một chiếc máy ảnh thực sự từ người bạn và dành vài tiếng đi bộ quanh thành phố chụp ảnh bằng nó thay vì điện thoại. Trải nghiệm nhiếp ảnh thay đổi hoàn toàn khi bạn không thể chụp ba mươi tấm trong mười giây và chọn tấm đẹp nhất sau. Mỗi cú bấm đòi hỏi suy nghĩ thực sự về bố cục và ánh sáng, và những tấm ảnh kết quả, kể cả những tấm không thành công, cảm thấy được cân nhắc hơn. Giờ tôi hiểu tại sao một số người nghiêm túc với nó như một thực hành.',
  },
  {
    vi: 'Tôi ăn bữa tối một mình trong nhà hàng và từng nghĩ điều đó thật cô đơn, nhưng hóa ra lại rất dễ chịu.',
    en: 'I had dinner alone at a restaurant last week, something I have always avoided because it used to feel uncomfortably self-conscious. I brought a book and ordered without hurrying and ate slowly and paid attention to the food in a way I rarely do when eating with other people. By the time I asked for the bill I was relaxed and genuinely glad I had come. Eating alone in public is a skill of sorts and I think I have finally acquired it.',
    vi_full: 'Tuần trước tôi ăn tối một mình tại nhà hàng, điều tôi luôn tránh vì cảm thấy tự ti theo cách khó chịu. Tôi mang theo một cuốn sách, gọi đồ mà không vội vàng, ăn chậm rãi và chú ý đến thức ăn theo cách tôi hiếm khi làm khi ăn cùng người khác. Khi đến lúc gọi hóa đơn tôi đã thư giãn và thực sự vui vì đã đến. Ăn một mình nơi công cộng là một kỹ năng nhất định và tôi nghĩ cuối cùng mình đã có được nó.',
  },
  {
    vi: 'Tôi nghĩ về ký ức tuổi thơ của mình và nhận ra rằng mình đã mang nhiều điều từ thời đó vào cuộc sống hiện tại hơn mình tưởng.',
    en: 'I have been thinking about my childhood more than usual recently, prompted partly by some old photographs I found while reorganizing a shelf. Looking at images of myself at eight or ten years old, I am struck by how continuous the person in them is with who I am now, the same interests visible in different forms, the same tendencies present in embryo. We carry our childhoods with us in ways that are not always obvious until we stop and look directly at the connection.',
    vi_full: 'Gần đây tôi hay nghĩ về tuổi thơ nhiều hơn bình thường, một phần do những bức ảnh cũ tìm thấy khi sắp xếp lại giá sách. Nhìn vào hình ảnh của bản thân lúc tám hay mười tuổi, tôi ấn tượng bởi sự liên tục của người trong đó với tôi của ngày hôm nay, cùng những sở thích hiện ra dưới các hình thức khác nhau, cùng những xu hướng có mặt ở dạng phôi thai. Chúng ta mang theo tuổi thơ theo những cách không phải lúc nào cũng rõ ràng cho đến khi dừng lại và nhìn thẳng vào sự kết nối.',
  },
  {
    vi: 'Tôi vô tình nghe được cuộc trò chuyện của hai người xa lạ trên tàu và thấy rằng mọi người đều đang cố gắng tìm cách sống.',
    en: 'I accidentally overheard a conversation between two strangers on the train this morning while they were talking about something difficult happening in one of their lives. I did not mean to listen but the carriage was quiet and they were close and I could not help it. What struck me was not the specific situation but the particular quality of the support being offered, practical and unhurried and genuinely present. Strangers carry entire worlds and most of the time we have no idea.',
    vi_full: 'Sáng nay tôi vô tình nghe cuộc trò chuyện giữa hai người lạ trên tàu khi họ đang nói về điều gì đó khó khăn đang xảy ra trong cuộc sống của một trong số họ. Tôi không cố ý nghe nhưng toa tàu yên tĩnh và họ ở gần và tôi không thể không nghe. Điều ấn tượng tôi không phải tình huống cụ thể mà là chất lượng đặc biệt của sự hỗ trợ được cung cấp, thực tế và thư thả và thực sự hiện diện. Người lạ mang theo cả thế giới và hầu hết thời gian chúng ta không có ý niệm gì.',
  },
  {
    vi: 'Tôi nhận ra mình hay lo lắng về tương lai đến mức đôi khi quên tận hưởng hiện tại đang rất ổn.',
    en: 'I noticed today that I was spending significant mental energy worrying about things that might happen in the next six months while the present moment, which was objectively quite good, was passing without much of my attention on it. The future that I was anxious about was almost entirely hypothetical, composed of outcomes that are possible rather than probable, while the actual present contained a pleasant day, good food, and nothing genuinely wrong. This observation did not immediately fix the pattern but it made it harder to maintain without noticing.',
    vi_full: 'Hôm nay tôi nhận thấy mình đang dành năng lượng tinh thần đáng kể lo lắng về những điều có thể xảy ra trong sáu tháng tới trong khi khoảnh khắc hiện tại, khách quan mà nói khá tốt, đang trôi qua mà không có nhiều sự chú ý của tôi. Tương lai tôi lo lắng về gần như hoàn toàn là giả thuyết, được tạo thành từ những kết quả có thể thay vì có khả năng, trong khi hiện tại thực sự chứa một ngày dễ chịu, đồ ăn ngon và không có gì thực sự sai. Quan sát này không ngay lập tức sửa thói quen nhưng làm nó khó duy trì mà không chú ý.',
  },
  {
    vi: 'Tôi và bạn thân quyết định thực hiện một thử thách nhỏ cùng nhau để động viên nhau trong một tháng.',
    en: 'My closest friend and I decided this week to run a small mutual accountability challenge for the next month, each of us committing to one specific daily habit and checking in with each other every evening. The habit I chose is a short daily walk outdoors regardless of weather, and hers is to stop working by a fixed time each evening. Having someone else involved makes the commitment feel more real than one made only to yourself, and the check-ins have already become a pleasant part of the day.',
    vi_full: 'Người bạn thân nhất của tôi và tôi quyết định tuần này chạy một thử thách trách nhiệm lẫn nhau nhỏ trong tháng tới, mỗi người cam kết với một thói quen hàng ngày cụ thể và kiểm tra với nhau mỗi buổi tối. Thói quen tôi chọn là đi bộ ngắn hàng ngày ngoài trời bất kể thời tiết, và của bạn là dừng làm việc vào giờ cố định mỗi tối. Có người khác tham gia làm cho cam kết cảm thấy thực hơn so với cam kết chỉ với bản thân, và các buổi kiểm tra đã trở thành phần dễ chịu của ngày.',
  },
  {
    vi: 'Tôi tham quan một bảo tàng mà tôi đã ở gần nhiều năm nhưng chưa bao giờ vào thăm.',
    en: 'I finally visited the museum that has been five minutes from my apartment for the past four years, having walked past it hundreds of times without ever actually going in. I spent two hours inside and discovered an exhibition on the history of the city I live in that was far more interesting than I expected. It is a strange thing to discover a worthwhile place so close to where you live after so long, and I have no good explanation for the delay beyond inertia.',
    vi_full: 'Cuối cùng tôi ghé thăm bảo tàng cách căn hộ năm phút trong bốn năm qua, đã đi qua hàng trăm lần mà không bao giờ thực sự bước vào. Tôi dành hai tiếng bên trong và khám phá ra một triển lãm về lịch sử thành phố mình sống thú vị hơn nhiều so với kỳ vọng. Thật kỳ lạ khi khám phá một nơi đáng giá gần nơi mình sống như vậy sau bao lâu, và tôi không có lý giải tốt nào cho sự trì hoãn ngoài quán tính.',
  },
  {
    vi: 'Tôi thử ăn chay trong một tuần và phát hiện ra rằng nấu ăn ngon mà không có thịt cần sự sáng tạo nhiều hơn.',
    en: 'I ate vegetarian for an entire week as an experiment, and discovered by the third day that the challenge was not missing meat but figuring out how to make vegetables interesting enough to feel like a complete meal. By the end of the week I had learned three new recipes and developed a genuine appreciation for certain ingredients I had previously treated as background material. I will not become fully vegetarian but I will cook more this way from now on.',
    vi_full: 'Tôi ăn chay cả tuần như một thí nghiệm, và khám phá ra vào ngày thứ ba rằng thách thức không phải là thiếu thịt mà là tìm cách làm rau trở nên thú vị đủ để cảm thấy như một bữa ăn hoàn chỉnh. Cuối tuần tôi đã học được ba công thức mới và phát triển sự trân trọng thực sự đối với một số nguyên liệu mà trước đây tôi đối xử như vật liệu nền. Tôi sẽ không trở thành người hoàn toàn ăn chay nhưng sẽ nấu ăn nhiều hơn theo cách này từ nay về sau.',
  },
  {
    vi: 'Tôi nhận ra rằng căn phòng mình đang sống cần thêm ánh sáng tự nhiên và sắp xếp lại mọi thứ để điều đó xảy ra.',
    en: 'I rearranged my living room this weekend with the specific aim of getting more natural light into the space throughout the day, moving the sofa away from the window and repositioning the desk so that I face the light when I work. The difference has been immediate and significant enough that I cannot believe I lived with the old arrangement for so long. Light changes everything about how a room feels to be in, and I had been living in a darker version of my own home unnecessarily.',
    vi_full: 'Cuối tuần này tôi sắp xếp lại phòng khách với mục tiêu cụ thể là đưa nhiều ánh sáng tự nhiên hơn vào không gian suốt ngày, di chuyển ghế sofa ra khỏi cửa sổ và định vị lại bàn làm việc để tôi hướng mặt về ánh sáng khi làm việc. Sự khác biệt tức thì và đủ đáng kể đến mức tôi không thể tin mình đã sống với cách sắp xếp cũ lâu đến vậy. Ánh sáng thay đổi mọi thứ về cảm giác của một căn phòng, và tôi đã sống trong phiên bản tối hơn của ngôi nhà mình một cách không cần thiết.',
  },
  {
    vi: 'Tôi quyết định học một kỹ năng mới hoàn toàn không liên quan đến công việc chỉ vì muốn thử thách bản thân.',
    en: 'I enrolled in a short course on something entirely unrelated to my work this week, choosing it purely on the basis that it sounded interesting and involved skills very different from anything I currently use. The decision felt slightly frivolous but also genuinely energizing, and I am looking forward to being a beginner again in a context where there is no professional stake and no one expects me to be competent. Sometimes learning something useless is precisely the point.',
    vi_full: 'Tuần này tôi đăng ký một khóa học ngắn về thứ gì đó hoàn toàn không liên quan đến công việc, chọn nó hoàn toàn vì nghe có vẻ thú vị và liên quan đến kỹ năng rất khác với bất cứ điều gì tôi hiện dùng. Quyết định cảm thấy hơi phù phiếm nhưng cũng thực sự tạo năng lượng, và tôi mong chờ được là người mới bắt đầu trở lại trong bối cảnh không có rủi ro nghề nghiệp và không ai kỳ vọng tôi có năng lực. Đôi khi học điều vô dụng chính xác là điểm mấu chốt.',
  },
  {
    vi: 'Tôi thử viết một bài thơ ngắn tối nay dù chưa bao giờ coi mình là người có năng khiếu sáng tác.',
    en: 'I wrote a short poem this evening, something I have not attempted since secondary school, not because I think I have any particular gift for it but because I wanted to see what would happen if I tried. The result was not good by any objective standard, full of forced rhymes and awkward line breaks, but the process of trying to fit a feeling into a tight form was surprisingly interesting. I may try again, privately, with no intention of showing anyone.',
    vi_full: 'Tối nay tôi viết một bài thơ ngắn, điều tôi chưa thử từ thời trung học, không phải vì tôi nghĩ mình có tài năng đặc biệt mà vì muốn xem điều gì sẽ xảy ra khi thử. Kết quả không tốt theo bất kỳ tiêu chuẩn khách quan nào, đầy những vần điệu gượng ép và ngắt dòng khó xử, nhưng quá trình cố gắng nhét một cảm xúc vào một hình thức chặt chẽ thực sự thú vị bất ngờ. Tôi có thể thử lại, riêng tư, không có ý định cho ai thấy.',
  },
  {
    vi: 'Tôi bắt đầu chú ý đến những điều nhỏ trong cuộc sống hàng ngày mà trước đây tôi hay bỏ qua.',
    en: 'I have been trying recently to pay closer attention to the texture of ordinary days rather than treating them as something to get through on the way to more significant moments. The quality of morning light through a particular window, the smell of rain on warm pavement, the specific sound my kettle makes in the last few seconds before it boils. None of these things is remarkable individually but collectively they constitute the actual fabric of a life, and I think noticing them matters.',
    vi_full: 'Gần đây tôi đang cố gắng chú ý chặt hơn đến kết cấu của những ngày bình thường thay vì coi chúng là thứ phải vượt qua trên đường đến những khoảnh khắc quan trọng hơn. Chất lượng ánh sáng buổi sáng qua một cửa sổ cụ thể, mùi mưa trên vỉa hè ấm, âm thanh cụ thể mà ấm đun nước tạo ra trong vài giây cuối trước khi sôi. Không thứ nào trong số này đáng chú ý riêng lẻ nhưng tổng thể chúng cấu thành vải thực sự của một cuộc sống, và tôi nghĩ việc để ý đến chúng là quan trọng.',
  },
  {
    vi: 'Tôi mua một quyển sổ tay mới và điều đó tạo ra một năng lượng kỳ lạ khiến tôi muốn viết lách nhiều hơn.',
    en: 'I bought a new notebook today from a small stationery shop I passed by chance, choosing one with thick cream-colored pages and a satisfying weight in the hand. There is something about a new and entirely empty notebook that carries possibility in a way that a half-used one does not, and I came home with the immediate desire to fill it with something worth keeping. I have had this feeling many times before and sometimes it produces real writing and sometimes just good intentions.',
    vi_full: 'Hôm nay tôi mua một quyển sổ mới từ một cửa hàng văn phòng phẩm nhỏ tình cờ đi qua, chọn một cuốn với những trang dày màu kem và trọng lượng thỏa mãn trong tay. Có điều gì đó về một quyển sổ mới và hoàn toàn trống mang theo khả năng theo cách mà một quyển đã dùng một nửa không có, và tôi về nhà với mong muốn tức thì điền đầy nó bằng thứ gì đó đáng giữ lại. Tôi đã có cảm giác này nhiều lần trước đây và đôi khi nó tạo ra bài viết thực sự và đôi khi chỉ là ý định tốt.',
  },
  {
    vi: 'Tôi dùng buổi trưa hôm nay để ngồi ngoài trời thay vì ăn tại bàn làm việc và nhận ra sự khác biệt đó lớn hơn mình nghĩ.',
    en: 'I took my lunch outside today and sat on a bench in the small square near the office instead of eating at my desk as I almost always do. Forty minutes of being outdoors in the middle of the day, watching people walk past and feeling the sun on my face, reset something in my mood that I had not realized needed resetting. I came back to work noticeably more focused and considerably less irritable. This is not a discovery that required a study to make, but apparently I needed to experience it personally.',
    vi_full: 'Hôm nay tôi mang bữa trưa ra ngoài và ngồi trên ghế ở quảng trường nhỏ gần văn phòng thay vì ăn ở bàn làm việc như tôi hầu như luôn làm. Bốn mươi phút ở ngoài trời giữa trưa, nhìn người ta đi qua và cảm nhận ánh nắng trên mặt, thiết lập lại điều gì đó trong tâm trạng mà tôi không nhận ra cần thiết lập lại. Tôi quay lại làm việc tập trung hơn rõ rệt và ít cáu kỉnh hơn đáng kể. Đây không phải khám phá cần một nghiên cứu để thực hiện, nhưng rõ ràng tôi cần trải nghiệm nó cá nhân.',
  },
  {
    vi: 'Tôi thấy mình đang ngủ ít hơn bình thường và cần phải làm gì đó để sửa lại thói quen này trước khi nó ảnh hưởng đến sức khỏe.',
    en: 'I have been getting significantly less sleep than usual for the past few weeks, staying up later than I intend to and then struggling to wake up when I need to without an alarm. The cumulative effect is a dullness of mind and a mildly short temper that I can recognize in myself even when I cannot quite manage to correct it. I know exactly what is needed and the knowledge is not the problem. The problem is the eleven at night decision that undermines the eight hours resolution.',
    vi_full: 'Vài tuần qua tôi ngủ ít hơn bình thường đáng kể, thức khuya hơn dự định rồi khó thức dậy khi cần không có đồng hồ báo. Tác động tích lũy là sự chậm chạp của tâm trí và tính cáu kỉnh nhẹ mà tôi có thể nhận ra trong bản thân ngay cả khi không thể quản lý để sửa. Tôi biết chính xác những gì cần thiết và kiến thức không phải vấn đề. Vấn đề là quyết định lúc mười một giờ đêm phá hoại quyết tâm tám tiếng.',
  },
  {
    vi: 'Tôi gặp một người rất thú vị tại một sự kiện và ước mình đã dũng cảm hơn để tiếp tục cuộc trò chuyện lâu hơn.',
    en: 'I met someone briefly at an event last week who seemed immediately interesting and worth knowing better, and I spent too much time wondering whether to continue the conversation rather than simply doing it, and by the time I decided to approach again they had moved on. I left with a small but real sense of a missed opportunity that lingered longer than it deserved to. The decision to start a conversation requires less courage than the extended deliberation about whether to start one.',
    vi_full: 'Tuần trước tôi gặp ngắn ai đó tại một sự kiện có vẻ ngay lập tức thú vị và đáng hiểu hơn, và tôi dành quá nhiều thời gian tự hỏi có nên tiếp tục cuộc trò chuyện hay không thay vì đơn giản làm nó, và khi tôi quyết định tiếp cận lại thì họ đã đi. Tôi rời đi với cảm giác nhỏ nhưng thực sự về cơ hội bị bỏ lỡ kéo dài hơn mức xứng đáng. Quyết định bắt đầu cuộc trò chuyện đòi hỏi ít can đảm hơn việc suy nghĩ kéo dài về việc có nên bắt đầu hay không.',
  },
  {
    vi: 'Tôi thực hành ngồi ăn mà không làm gì khác, không điện thoại, không TV — và phát hiện ra đó là một kỹ năng cần học.',
    en: 'I have been making an effort to eat meals without any simultaneous screen use, which sounds trivial but has turned out to require genuine deliberate practice. My automatic response when I sit down to eat alone is to reach for my phone within about thirty seconds, and resisting that impulse while doing nothing except eating takes more conscious effort than seems reasonable. The meals themselves taste better when I am fully present for them, which is useful and slightly embarrassing information.',
    vi_full: 'Tôi đang nỗ lực ăn bữa mà không dùng màn hình cùng lúc, điều nghe có vẻ nhỏ nhặt nhưng hóa ra đòi hỏi thực hành có chủ ý thực sự. Phản ứng tự động của tôi khi ngồi xuống ăn một mình là với tay lấy điện thoại trong khoảng ba mươi giây, và chống lại thôi thúc đó trong khi không làm gì ngoài ăn đòi hỏi nỗ lực có ý thức nhiều hơn có vẻ hợp lý. Bản thân các bữa ăn ngon hơn khi tôi hoàn toàn hiện diện với chúng, đó là thông tin hữu ích và hơi đáng xấu hổ.',
  },
  {
    vi: 'Hôm nay tôi viết thư cho phiên bản tương lai của bản thân và cảm thấy đó là một trong những bài tập thú vị nhất mình từng thử.',
    en: 'I wrote a letter to my future self today, addressed to the version of me that will read it in five years, and the exercise turned out to be much more clarifying than I expected. Having to articulate what I hope will be true, what I am working toward, and what I want to be remembered for having tried forced me to identify beliefs I did not know I held clearly enough to express. I sealed it and saved it and I am genuinely curious what I will think of it when I open it.',
    vi_full: 'Hôm nay tôi viết thư cho bản thân tương lai, gửi đến phiên bản của tôi sẽ đọc nó sau năm năm, và bài tập hóa ra làm rõ ràng hơn nhiều so với kỳ vọng. Việc phải diễn đạt những gì tôi hy vọng sẽ đúng, những gì tôi đang hướng tới và những gì tôi muốn được nhớ đến vì đã thử buộc tôi xác định những niềm tin tôi không biết mình giữ đủ rõ ràng để diễn đạt. Tôi niêm phong và lưu nó và thực sự tò mò mình sẽ nghĩ gì khi mở ra.',
  },
  {
    vi: 'Tôi cố gắng dành ít nhất mười lăm phút mỗi ngày làm điều gì đó chỉ vì thấy vui, không phải vì có ích hay có kết quả.',
    en: 'I have been trying to protect a small amount of time each day for something I do purely because I enjoy it, with no goal attached and no useful outcome expected. It sounds straightforward but turns out to require a kind of permission I find difficult to give myself, as if pleasure that does not produce anything is somehow not quite justified. I am working on this and the practice of it is teaching me something about the assumptions I have accumulated about how time should be spent.',
    vi_full: 'Tôi đang cố gắng bảo vệ một lượng thời gian nhỏ mỗi ngày cho điều gì đó tôi làm thuần túy vì thích, không có mục tiêu đính kèm và không có kết quả hữu ích được mong đợi. Nghe có vẻ đơn giản nhưng hóa ra đòi hỏi một loại sự cho phép mà tôi thấy khó trao cho bản thân, như thể niềm vui không tạo ra gì thì bằng cách nào đó không hoàn toàn được biện minh. Tôi đang thực hành điều này và quá trình của nó đang dạy tôi điều gì đó về những giả định tôi đã tích lũy về cách thời gian nên được chi tiêu.',
  },
  {
    vi: 'Tôi gặp một người cao tuổi trên xe buýt và cuộc trò chuyện ngắn ngủi với ông ấy cho tôi cái nhìn mới về nhiều thứ.',
    en: 'I had an unexpected conversation on the bus this morning with an elderly man who sat next to me and, unprompted, began to talk about his life. He was in his late eighties and remarkably clear and specific in the way he described things, and I found myself listening with complete attention for the twenty minutes we shared the ride. He said one thing in particular about regret that I am still thinking about now, about how the things he wished he had done differently were nearly all about what he had not said rather than what he had.',
    vi_full: 'Sáng nay trên xe buýt tôi có một cuộc trò chuyện bất ngờ với một cụ ông ngồi cạnh và, không cần khơi mào, bắt đầu kể về cuộc sống của ông. Ông ngoài tám mươi và đáng chú ý rõ ràng và cụ thể trong cách mô tả mọi thứ, và tôi thấy mình lắng nghe với sự chú ý hoàn toàn trong hai mươi phút chúng tôi chia sẻ chuyến xe. Ông nói một điều đặc biệt về sự hối tiếc mà tôi vẫn đang suy nghĩ, về việc những gì ông ước đã làm khác đi hầu hết đều là về những gì ông chưa nói chứ không phải những gì đã nói.',
  },
  {
    vi: 'Tôi đang học cách kiên nhẫn hơn không chỉ với người khác mà còn với chính mình và tiến trình của riêng mình.',
    en: 'I am trying to get better at patience, not the passive kind of waiting but the active kind that involves continuing to work at something while accepting that the results will arrive in their own time rather than mine. This applies to professional goals, to learning new things, and perhaps most importantly to my own emotional development, where I tend to expect progress to be linear and am consistently surprised when it is not. Growth is not a graph, which is something I understand but have not yet fully internalized.',
    vi_full: 'Tôi đang cố gắng tốt hơn về sự kiên nhẫn, không phải loại chờ đợi thụ động mà loại chủ động liên quan đến việc tiếp tục làm việc ở điều gì đó trong khi chấp nhận rằng kết quả sẽ đến theo thời gian của nó chứ không phải của tôi. Điều này áp dụng cho các mục tiêu nghề nghiệp, học điều mới, và có lẽ quan trọng nhất là sự phát triển cảm xúc của chính mình, nơi tôi có xu hướng kỳ vọng tiến bộ tuyến tính và luôn bất ngờ khi không phải vậy. Sự tăng trưởng không phải là một đồ thị, đó là điều tôi hiểu nhưng chưa hoàn toàn nội tâm hóa.',
  },
  {
    vi: 'Tôi thử sống tối giản hơn một tháng và thấy rằng mình cần ít thứ hơn rất nhiều so với điều mình vẫn nghĩ.',
    en: 'I have been living with less for the past month, buying nothing non-essential and making do with what I already have, and the experiment has been surprisingly comfortable. I expected to feel deprived and instead feel mostly unencumbered. The things I thought I needed turned out to be mostly replaceable by alternatives I already owned or simply unnecessary when examined without the usual background noise of wanting. I have not converted to any particular philosophy but I am spending more carefully.',
    vi_full: 'Một tháng qua tôi sống với ít hơn, không mua gì không thiết yếu và tận dụng những gì đã có, và thí nghiệm này thoải mái hơn bất ngờ. Tôi kỳ vọng cảm thấy thiếu thốn nhưng thay vào đó hầu hết cảm thấy không bị ràng buộc. Những thứ tôi nghĩ mình cần hóa ra hầu hết có thể thay thế bằng các lựa chọn thay thế tôi đã sở hữu hoặc đơn giản là không cần thiết khi được xem xét mà không có tiếng ồn nền thông thường của sự muốn. Tôi không chuyển đổi sang bất kỳ triết lý cụ thể nào nhưng đang chi tiêu cẩn thận hơn.',
  },
  {
    vi: 'Tôi nhận ra rằng những người tôi ngưỡng mộ nhất đều có điểm chung là họ không bỏ cuộc khi mọi thứ trở nên khó khăn.',
    en: 'I have been thinking about the people I genuinely admire and trying to identify what they have in common beyond the obvious external markers of achievement. What I keep coming back to is not talent or intelligence or even hard work in the generic sense, but a specific quality of not quitting when things become difficult or disappointing. They seem to have a working relationship with failure that allows them to continue through it rather than being stopped by it, and I think that quality is more learnable than it is innate.',
    vi_full: 'Tôi đang suy nghĩ về những người tôi thực sự ngưỡng mộ và cố gắng xác định điều họ có chung ngoài những dấu hiệu thành tích bên ngoài rõ ràng. Điều tôi cứ quay lại không phải tài năng hay trí thông minh hay ngay cả làm việc chăm chỉ theo nghĩa chung, mà là một chất lượng cụ thể của việc không bỏ cuộc khi mọi thứ trở nên khó khăn hay thất vọng. Họ có vẻ có mối quan hệ làm việc với thất bại cho phép họ tiếp tục qua nó thay vì bị dừng lại bởi nó, và tôi nghĩ chất lượng đó có thể học được nhiều hơn là bẩm sinh.',
  },
  {
    vi: 'Tôi bắt đầu nghe podcast tiếng Anh mỗi khi di chuyển và nhận ra đó là cách học rất hiệu quả mà không mất thêm thời gian.',
    en: 'I started listening to English language podcasts during my daily commute about six weeks ago and the improvement in my listening comprehension has been gradual but real. The key was choosing podcasts about subjects I am actually interested in rather than content designed specifically for language learners, because genuine interest makes sustained attention much easier to maintain. I no longer think of the commute as wasted time but as a reasonably reliable daily learning session that requires no additional effort to fit in.',
    vi_full: 'Sáu tuần trước tôi bắt đầu nghe podcast tiếng Anh trong hành trình hàng ngày và sự cải thiện trong khả năng nghe hiểu là dần dần nhưng thực sự. Điều quan trọng là chọn podcast về các chủ đề tôi thực sự quan tâm thay vì nội dung được thiết kế đặc biệt cho người học ngôn ngữ, vì sự quan tâm thực sự làm cho sự chú ý kéo dài dễ duy trì hơn nhiều. Tôi không còn coi hành trình là thời gian lãng phí mà là buổi học hàng ngày tương đối đáng tin cậy không đòi hỏi nỗ lực bổ sung để phù hợp.',
  },
  {
    vi: 'Tôi thử một ngày không phàn nàn về bất cứ điều gì và phát hiện ra mình hay phàn nàn nhiều hơn mình tưởng.',
    en: 'I tried not to complain about anything for one full day last week, which turned out to be considerably harder than I expected and revealed that complaining is a much more habitual part of my speech than I had realized. I caught myself at least a dozen times starting sentences that were heading toward a minor grievance about the weather, traffic, technology, or workload, and had to redirect them. The experiment was useful if humbling, and the day was not noticeably worse for the absence of complaints.',
    vi_full: 'Tuần trước tôi thử không phàn nàn về bất cứ điều gì trong một ngày đầy đủ, điều hóa ra khó hơn đáng kể so với kỳ vọng và tiết lộ rằng phàn nàn là phần thói quen trong lời nói của tôi nhiều hơn tôi nhận ra. Tôi bắt gặp mình ít nhất một tá lần bắt đầu những câu đang hướng đến một khiếu nại nhỏ về thời tiết, giao thông, công nghệ hay khối lượng công việc, và phải chuyển hướng chúng. Thí nghiệm hữu ích dù khiêm nhường, và ngày không tệ hơn đáng kể vì không có những phàn nàn.',
  },
  {
    vi: 'Tôi ước mình có thể nhắn tin cho phiên bản của mình hai mươi năm trước và chỉ nói rằng: đừng lo, mọi thứ rồi sẽ ổn.',
    en: 'If I could send a brief message back to myself at twenty, it would not be advice about decisions or directions but simply a reassurance about outcome. The things I was most worried about at that age either resolved themselves, turned out not to matter as much as I feared, or taught me something important through how they went wrong. I was anxious in a way that felt very necessary at the time and now seems rather excessive, though I know my younger self could not have found it excessive with the information available.',
    vi_full: 'Nếu có thể gửi một tin nhắn ngắn về cho bản thân lúc hai mươi tuổi, đó sẽ không phải lời khuyên về quyết định hay hướng đi mà chỉ đơn giản là sự trấn an về kết quả. Những điều tôi lo lắng nhất ở tuổi đó hoặc tự giải quyết, hóa ra không quan trọng như tôi sợ, hoặc dạy tôi điều gì đó quan trọng qua cách chúng trở nên sai. Tôi lo lắng theo cách cảm thấy rất cần thiết vào thời điểm đó và giờ có vẻ khá quá mức, dù tôi biết bản thân trẻ hơn không thể thấy nó quá mức với thông tin sẵn có.',
  },
  {
    vi: 'Tôi dọn dẹp hộp thư điện tử có hàng nghìn email chưa đọc và cảm thấy thanh thản đến mức kỳ lạ.',
    en: 'I cleared my email inbox today for the first time in several years, deleting or archiving thousands of unread messages that had accumulated into a number I found too large to think about. The process took most of a Sunday afternoon and was tedious but oddly satisfying, and when I arrived at an inbox showing zero unread messages I felt a relief that was out of all proportion to the practical significance of what I had done. A clean inbox changes nothing about actual life and yet something shifted.',
    vi_full: 'Hôm nay tôi dọn sạch hộp thư điện tử lần đầu tiên trong nhiều năm, xóa hoặc lưu trữ hàng nghìn tin nhắn chưa đọc đã tích lũy thành một số lượng tôi thấy quá lớn để nghĩ đến. Quá trình mất phần lớn buổi chiều Chủ Nhật và tẻ nhạt nhưng kỳ lạ thỏa mãn, và khi tôi đến hộp thư hiển thị không có tin nhắn chưa đọc tôi cảm thấy sự nhẹ nhõm không tương xứng với ý nghĩa thực tế của những gì tôi đã làm. Hộp thư sạch không thay đổi gì về cuộc sống thực nhưng có điều gì đó đã dịch chuyển.',
  },
  {
    vi: 'Tôi thử nói chuyện thành thật hơn về những điều khó khăn mình đang trải qua thay vì luôn nói rằng mọi thứ đều ổn.',
    en: 'I have been trying to answer the question of how are you more honestly when people I trust ask it, instead of defaulting to the fine that costs nothing but also communicates nothing. It is surprisingly difficult. The reflex to reassure people that everything is under control is very strong, even with people who would genuinely like to know how things are. But the few times I have answered honestly this week the conversations that followed have been considerably more real and more useful than the alternative.',
    vi_full: 'Tôi đang cố gắng trả lời câu hỏi "bạn khỏe không" thành thật hơn khi những người tôi tin tưởng hỏi, thay vì mặc định là "tốt" không tốn gì nhưng cũng không giao tiếp gì. Điều đó ngạc nhiên khó. Phản xạ trấn an người ta rằng mọi thứ đang được kiểm soát rất mạnh, ngay cả với những người thực sự muốn biết mọi thứ như thế nào. Nhưng vài lần tôi trả lời thành thật tuần này các cuộc trò chuyện tiếp theo thực sự hơn và hữu ích hơn đáng kể so với lựa chọn thay thế.',
  },
  {
    vi: 'Tôi tham gia một buổi hội thảo về chủ đề tôi chưa biết gì và thấy cảm giác hoàn toàn là người mới lại thật sự sảng khoái.',
    en: 'I attended a workshop on a topic I know almost nothing about and the experience of being a complete novice in a room of people at various levels of familiarity with the material was unexpectedly freeing. I had nothing to protect, no reputation to maintain, and could ask the most basic questions without embarrassment. Being genuinely new to something is a sensation we rarely seek out as adults, and I had forgotten how energizing it can be to not know anything yet.',
    vi_full: 'Tôi tham dự một hội thảo về chủ đề tôi gần như không biết gì và trải nghiệm là người mới hoàn toàn trong phòng với những người ở các mức độ quen thuộc khác nhau với tài liệu thực sự giải phóng bất ngờ. Tôi không có gì để bảo vệ, không có danh tiếng để duy trì và có thể hỏi những câu hỏi cơ bản nhất mà không xấu hổ. Thực sự mới với điều gì đó là cảm giác chúng ta hiếm khi tìm kiếm khi trưởng thành, và tôi đã quên việc chưa biết gì có thể tạo năng lượng như thế nào.',
  },
  {
    vi: 'Tôi nhìn lại những mục tiêu thất bại của mình và nhận ra chúng dạy tôi nhiều hơn những thành công.',
    en: 'I reviewed some goals I had set but failed to meet last year, trying to understand them with more honesty and less judgment than I usually manage. What I found was that the failures generally fell into two categories: goals that were wrong for me and goals that were right but approached in the wrong way. The distinction between these two types is important because they require completely different responses, and getting that analysis right probably matters more than the original goal did.',
    vi_full: 'Tôi xem xét lại một số mục tiêu đã đặt nhưng không đạt được năm ngoái, cố gắng hiểu chúng với sự thành thật nhiều hơn và ít phán xét hơn tôi thường làm được. Những gì tôi thấy là các thất bại nói chung rơi vào hai loại: mục tiêu sai với tôi và mục tiêu đúng nhưng tiếp cận theo cách sai. Sự phân biệt giữa hai loại này quan trọng vì chúng đòi hỏi các phản ứng hoàn toàn khác nhau, và việc phân tích đúng đó có lẽ quan trọng hơn mục tiêu gốc.',
  },
  {
    vi: 'Tôi mất một thứ gì đó quan trọng và trong quá trình tìm kiếm lại tìm thấy nhiều thứ khác mình tưởng đã mất.',
    en: 'I spent an hour this morning looking for something I had misplaced and found, in the process of searching through various drawers and boxes, several things I had given up for lost over the past year. A watch I thought I had left somewhere, a specific letter I had been meaning to reread, a small object that had belonged to someone no longer alive. Looking for one lost thing and finding other lost things along the way felt like an unexpectedly appropriate metaphor for something, though I am not sure what.',
    vi_full: 'Sáng nay tôi dành một tiếng tìm thứ gì đó tôi đặt nhầm chỗ và tìm thấy, trong quá trình lục tìm các ngăn kéo và hộp khác nhau, một số thứ tôi đã từ bỏ coi như mất trong năm qua. Một chiếc đồng hồ tôi nghĩ đã để lại đâu đó, một bức thư cụ thể tôi định đọc lại, một vật nhỏ từng thuộc về người không còn sống. Tìm kiếm một thứ đã mất và tìm thấy những thứ đã mất khác trên đường cảm thấy như một ẩn dụ phù hợp bất ngờ cho điều gì đó, dù tôi không chắc điều gì.',
  },
  {
    vi: 'Tôi hỏi bố mẹ về câu chuyện hồi trẻ của họ và lần đầu tiên thực sự lắng nghe câu trả lời.',
    en: 'I asked my parents this weekend about their lives before I was born, something I have never done with real curiosity before. I have always known the broad outline but never the texture, the specific details of how they met, what they were afraid of, what they wanted that they did not get, what they got that they had not planned on. The conversation lasted much longer than dinner and I came away knowing my parents as people in a way I had not quite managed before, which felt long overdue.',
    vi_full: 'Cuối tuần này tôi hỏi bố mẹ về cuộc sống của họ trước khi tôi sinh ra, điều tôi chưa bao giờ làm với sự tò mò thực sự trước đây. Tôi luôn biết đường nét chung nhưng không bao giờ biết kết cấu, các chi tiết cụ thể về cách họ gặp nhau, những gì họ sợ, những gì họ muốn mà không nhận được, những gì họ nhận được mà không lên kế hoạch. Cuộc trò chuyện kéo dài lâu hơn bữa tối nhiều và tôi rời đi biết bố mẹ như những con người theo cách tôi chưa quản lý được trước đây, điều cảm thấy đã quá hạn lâu.',
  },
  {
    vi: 'Tôi học cách chấp nhận khen ngợi mà không hạ thấp bản thân ngay sau đó — đây là một thói quen cần thay đổi.',
    en: 'I have been working on accepting compliments without immediately deflecting them, which turns out to be a surprisingly ingrained habit to break. My usual pattern is to receive a positive comment and immediately produce a qualification or a disclaimer that signals I do not entirely believe what was said. I am trying to replace this with a simple thank you and a moment of actually taking in what was offered, without rushing past it. The discomfort of doing so is itself informative.',
    vi_full: 'Tôi đang thực hành chấp nhận lời khen mà không ngay lập tức né tránh chúng, điều hóa ra là thói quen ăn sâu đáng ngạc nhiên để phá vỡ. Mô hình thông thường của tôi là nhận một bình luận tích cực và ngay lập tức tạo ra một điều kiện hay tuyên bố miễn trách nhiệm báo hiệu tôi không hoàn toàn tin điều được nói. Tôi đang cố gắng thay thế điều này bằng một lời cảm ơn đơn giản và một khoảnh khắc thực sự tiếp nhận những gì được cung cấp, không vội vã bỏ qua nó. Sự khó chịu khi làm vậy tự thân đã là thông tin.',
  },
  {
    vi: 'Tôi thử không đặt kết quả nào cho bản thân trong một tuần và sống hoàn toàn theo cảm hứng — kết quả rất thú vị.',
    en: 'I spent one week deliberately without targets or plans of any kind, making no lists, setting no goals, and simply responding to each day as it unfolded. It was an interesting experiment and produced a week that felt both more alive in some moments and more restless in others than my usual structured approach. I discovered I need more structure than I sometimes admit, but also that I leave very little room for unplanned good things to happen in my ordinary scheduled life.',
    vi_full: 'Tôi dành một tuần cố tình không có mục tiêu hay kế hoạch nào, không làm danh sách, không đặt mục tiêu, và chỉ đơn giản phản ứng với từng ngày khi nó diễn ra. Đó là một thí nghiệm thú vị và tạo ra một tuần cảm thấy vừa sống động hơn ở một số khoảnh khắc và bồn chồn hơn ở những khoảnh khắc khác so với cách tiếp cận có cấu trúc thông thường. Tôi khám phá mình cần nhiều cấu trúc hơn đôi khi thừa nhận, nhưng cũng để lại rất ít chỗ cho những điều tốt không có kế hoạch xảy ra trong cuộc sống theo lịch trình thông thường.',
  },
  {
    vi: 'Cuộc sống tôi đang ở giai đoạn chuyển tiếp và mặc dù điều đó không dễ, tôi cảm thấy điều gì đó tốt đẹp đang hình thành.',
    en: 'I am in a period of transition that I cannot fully describe yet because I do not know what it is transitioning toward. Some things that were stable are becoming less so, and some habits and patterns that felt permanent are loosening in ways that are uncomfortable and also quietly exciting. I have been in these threshold periods before and I know from experience that something worth having usually becomes possible on the other side, even when the middle part is genuinely difficult to navigate.',
    vi_full: 'Tôi đang trong giai đoạn chuyển tiếp mà tôi chưa thể mô tả đầy đủ vì không biết nó đang chuyển tiếp về phía nào. Một số thứ vốn ổn định đang trở nên ít ổn định hơn, và một số thói quen và mô hình cảm thấy vĩnh viễn đang nới lỏng theo những cách không thoải mái và cũng âm thầm thú vị. Tôi đã từng trải qua những giai đoạn ngưỡng này trước đây và tôi biết từ kinh nghiệm rằng thứ gì đó đáng có thường trở nên có thể ở phía bên kia, ngay cả khi phần giữa thực sự khó điều hướng.',
  },
  {
    vi: 'Tôi học được rằng quan tâm đến bản thân không phải là ích kỷ — đó là điều kiện để có thể quan tâm đến người khác.',
    en: 'I have been recalibrating my understanding of what it means to take care of yourself, separating it from the self-indulgent association the phrase sometimes carries. What I am arriving at is the idea that maintaining your own energy and wellbeing is not a luxury or a self-centered act but a precondition for being genuinely useful and present for other people. You cannot give what you do not have, and regularly replenishing what is spent is not optional if you want to keep giving it.',
    vi_full: 'Tôi đang hiệu chỉnh lại hiểu biết của mình về ý nghĩa của việc tự chăm sóc bản thân, tách nó khỏi mối liên hệ tự chiều mà cụm từ đôi khi mang theo. Những gì tôi đang đến là ý tưởng rằng duy trì năng lượng và sức khỏe của chính mình không phải là xa xỉ hay hành động tự kỷ mà là điều kiện tiên quyết để thực sự hữu ích và hiện diện cho người khác. Bạn không thể cho những gì bạn không có, và thường xuyên bổ sung những gì đã tiêu là không tùy chọn nếu bạn muốn tiếp tục cho đi.',
  },
  {
    vi: 'Tôi tạo ra một thói quen mới nhỏ xíu và sau vài tuần nó đã trở thành một phần của ngày mà tôi không thể thiếu.',
    en: 'I added one very small habit to my morning about a month ago, something that takes about five minutes and on its own seems completely inconsequential. But over the weeks it has accumulated into something that genuinely shapes how the rest of the morning goes, and on the days I skip it I notice an absence. This has reinforced my belief that the smallest sustainable change is worth more than the grandest intention that cannot be maintained, and that most meaningful change begins much more modestly than we expect.',
    vi_full: 'Khoảng một tháng trước tôi thêm một thói quen rất nhỏ vào buổi sáng, điều mất khoảng năm phút và tự thân có vẻ hoàn toàn không đáng kể. Nhưng qua các tuần nó đã tích lũy thành điều gì đó thực sự định hình cách phần còn lại của buổi sáng diễn ra, và những ngày tôi bỏ qua thì nhận ra sự vắng mặt. Điều này củng cố niềm tin của tôi rằng sự thay đổi bền vững nhỏ nhất có giá trị hơn ý định vĩ đại nhất không thể duy trì, và rằng hầu hết sự thay đổi có ý nghĩa bắt đầu khiêm tốn hơn nhiều so với kỳ vọng.',
  },
  {
    vi: 'Tôi nhận ra mình đang sống quá nhiều trong đầu và cần dành nhiều thời gian hơn cho những trải nghiệm thực tế bên ngoài.',
    en: 'I have been noticing recently that I spend a great deal of time inside my own head, thinking about things that have happened or might happen rather than engaging with what is actually in front of me. This is partly temperament and partly habit, and the balance has tipped too far in the direction of internal experience at the expense of external engagement. I have decided to accept more invitations I might otherwise decline and to be present more deliberately in the situations I find myself in.',
    vi_full: 'Gần đây tôi nhận thấy mình dành nhiều thời gian trong đầu, suy nghĩ về những điều đã xảy ra hay có thể xảy ra thay vì tham gia với những gì thực sự đang ở trước mặt. Điều này một phần là tính khí và một phần là thói quen, và cân bằng đã nghiêng quá nhiều về phía trải nghiệm nội tâm trả giá bằng sự tham gia bên ngoài. Tôi quyết định chấp nhận nhiều lời mời hơn mà tôi có thể từ chối và hiện diện có chủ ý hơn trong các tình huống mình thấy mình trong đó.',
  },
  {
    vi: 'Tôi thử thiền định mỗi sáng trong hai tuần và nhận thấy rằng bản thân mình đang trở nên bình tĩnh hơn một chút.',
    en: 'I have been meditating for ten minutes each morning for the past two weeks, following a very simple approach of focusing on breathing and gently returning attention when it wanders, which it does very frequently. The results are modest but real. I am slightly less reactive in irritating situations, slightly quicker to notice when I am getting anxious, and somewhat better at not following every thought to its anxious conclusion. Small improvements consistently applied seem to add up in ways that are not dramatic but are genuinely useful.',
    vi_full: 'Hai tuần qua tôi thiền mười phút mỗi sáng, theo cách tiếp cận rất đơn giản là tập trung vào hơi thở và nhẹ nhàng đưa sự chú ý trở lại khi nó lang thang, điều xảy ra rất thường xuyên. Kết quả khiêm tốn nhưng thực. Tôi ít phản ứng hơn một chút trong các tình huống khó chịu, nhanh hơn một chút để nhận thấy khi đang lo lắng, và tốt hơn một chút trong việc không theo mỗi suy nghĩ đến kết luận lo lắng của nó. Những cải tiến nhỏ được áp dụng nhất quán có vẻ cộng lại theo những cách không kịch tính nhưng thực sự hữu ích.',
  },
  {
    vi: 'Tôi đọc cuốn sách về thói quen và nhận ra rằng hầu hết những gì tôi làm mỗi ngày đều là tự động và không có ý thức.',
    en: 'I have been reading about the science of habit formation and was struck by the estimate that roughly half of what we do each day is driven by habit rather than deliberate decision. When I tried to actually count my own automatic behaviors from the moment I wake up to the moment I sleep, the number was much higher than I expected. Most of what I call my daily life is a set of routines I entered into at some point and then stopped examining, which is both efficient and potentially limiting.',
    vi_full: 'Tôi đọc về khoa học hình thành thói quen và bị ấn tượng bởi ước tính rằng khoảng một nửa những gì chúng ta làm mỗi ngày được thúc đẩy bởi thói quen thay vì quyết định có chủ ý. Khi tôi cố thực sự đếm các hành vi tự động của mình từ lúc thức dậy đến lúc ngủ, con số cao hơn nhiều so với kỳ vọng. Hầu hết những gì tôi gọi là cuộc sống hàng ngày là một tập hợp các thói quen tôi bắt đầu vào một thời điểm nào đó và sau đó ngừng xem xét, điều này vừa hiệu quả vừa có thể hạn chế.',
  },
  {
    vi: 'Tôi thử làm một điều khiến mình sợ mỗi tuần như một cách rèn luyện sự dũng cảm theo nghĩa nhỏ nhưng thực tiễn.',
    en: 'I set myself a challenge this month to do one thing each week that makes me slightly uncomfortable but that I would otherwise avoid without a specific reason. Last week it was making a phone call I had been putting off. This week it was speaking up in a meeting when I had something to say rather than waiting to see if someone else would say it first. These are small acts but the muscle they build seems to be the same one required for larger acts of courage.',
    vi_full: 'Tháng này tôi đặt thách thức bản thân làm một điều mỗi tuần khiến mình hơi không thoải mái nhưng nếu không thì sẽ tránh mà không có lý do cụ thể. Tuần trước là thực hiện một cuộc gọi điện tôi đã trì hoãn. Tuần này là lên tiếng trong cuộc họp khi tôi có điều muốn nói thay vì chờ xem có ai khác nói trước không. Đây là những hành động nhỏ nhưng cơ bắp chúng xây dựng có vẻ là cùng một cái cần thiết cho những hành động can đảm lớn hơn.',
  },
  {
    vi: 'Tôi nhận ra rằng những cuộc trò chuyện tốt nhất thường xảy ra khi không ai lên kế hoạch cho chúng.',
    en: 'The best conversations I have always seem to happen when they are not planned, emerging unexpectedly in the middle of something else, usually late in the evening when the structured part of an occasion is finished and people relax into something less deliberate. You cannot engineer these conversations but you can create conditions where they become more likely, which generally involves slowing down, having fewer distractions, and being willing to follow a thread wherever it goes rather than steering it back to somewhere comfortable.',
    vi_full: 'Những cuộc trò chuyện tốt nhất của tôi luôn có vẻ xảy ra khi chúng không có kế hoạch, nảy sinh bất ngờ ở giữa điều gì đó khác, thường muộn vào buổi tối khi phần có cấu trúc của một dịp kết thúc và mọi người thư giãn vào điều gì đó kém có chủ ý hơn. Bạn không thể kỹ thuật hóa những cuộc trò chuyện này nhưng có thể tạo điều kiện để chúng trở nên có khả năng hơn, điều đó thường liên quan đến việc chậm lại, có ít xao nhãng hơn và sẵn sàng theo một sợi chỉ bất cứ nơi nào nó dẫn thay vì điều hướng trở lại nơi nào đó thoải mái.',
  },
  {
    vi: 'Tôi và người bạn thân chưa nói chuyện được nhiều tháng cuối cùng cũng có dịp gặp nhau và tôi nhớ lại tại sao người đó quan trọng với mình.',
    en: 'I finally managed to see a close friend today for the first time in nearly four months, our schedules having failed to align despite good intentions on both sides. The first few minutes were slightly awkward in the way that gaps in contact create, but by the time we had ordered food the conversation had found its own level and everything that had accumulated in the months of not talking began to come out. Some friendships are deep enough that the gaps do not matter, and it was good to confirm that this one is.',
    vi_full: 'Hôm nay tôi cuối cùng cũng gặp được một người bạn thân lần đầu tiên sau gần bốn tháng, dù cả hai đều có ý định tốt nhưng lịch trình cứ không khớp nhau. Vài phút đầu có chút gượng gạo như thường thấy sau những khoảng cách dài, nhưng khi thức ăn được mang ra thì câu chuyện đã tự tìm được nhịp điệu riêng và mọi thứ tích lũy trong những tháng không nói chuyện bắt đầu tuôn ra. Một số tình bạn đủ sâu để những khoảng cách không còn quan trọng, và thật vui khi được xác nhận rằng tình bạn này là như vậy.',
  },
  {
    vi: 'Tôi nhìn ra cửa sổ văn phòng hôm nay và ước mình đang ở ngoài đó thay vì ngồi trong đây, nhưng rồi tôi nhắc nhở bản thân rằng điều đó cũng bình thường.',
    en: 'I spent several minutes this afternoon looking out the office window at the street below and feeling a pull toward being outside that was strong enough to be distracting. It was an ordinary day with nothing particularly appealing about the weather or the street, but sitting in an indoor space for many hours creates its own kind of restlessness that has nothing to do with what is actually outside. I noted the feeling, let it pass, and returned to what I was doing, which is probably the most mature response available.',
    vi_full: 'Tôi đã dành vài phút chiều nay nhìn qua cửa sổ văn phòng xuống con phố bên dưới và cảm thấy một sức kéo muốn ra ngoài đủ mạnh để gây xao nhãng. Đó là một ngày bình thường, không có gì đặc biệt hấp dẫn về thời tiết hay con phố, nhưng ngồi trong không gian kín nhiều giờ tạo ra một loại bồn chồn riêng không liên quan gì đến những gì thực sự đang ở bên ngoài. Tôi nhận ra cảm giác đó, để nó qua đi, rồi quay lại công việc, đó có lẽ là phản ứng trưởng thành nhất có thể có.',
  },
  {
    vi: 'Tôi nói chuyện với một người mà mình không hiểu lắm và lần này thử lắng nghe thay vì phán xét, và điều đó tạo ra sự khác biệt lớn.',
    en: 'I had a conversation today with someone whose views I find difficult and usually respond to with internal impatience, and I made a deliberate choice to listen properly rather than preparing my response while they were still speaking. The effort required was noticeable and the result was not that I changed my mind, but I understood the position better and found a genuine point of agreement that I would have missed if I had been less attentive. Listening is harder than speaking and I need to practice it more.',
    vi_full: 'Hôm nay tôi có một cuộc trò chuyện với người có quan điểm mà tôi thấy khó chịu và thường phản ứng với sự thiếu kiên nhẫn nội tâm, nhưng tôi đã quyết định có chủ ý lắng nghe thật sự thay vì chuẩn bị câu trả lời trong khi họ còn đang nói. Nỗ lực cần thiết rõ ràng và kết quả không phải là tôi thay đổi quan điểm, nhưng tôi hiểu vị trí đó tốt hơn và tìm thấy một điểm đồng ý thực sự mà tôi đã bỏ lỡ nếu không chú ý. Lắng nghe khó hơn nói chuyện và tôi cần thực hành nó nhiều hơn.',
  },
  {
    vi: 'Tôi đang ở giai đoạn cuộc sống mà tôi biết mình muốn thay đổi nhưng chưa biết thay đổi thành gì, và sự không chắc chắn đó vừa khó chịu vừa thú vị.',
    en: 'I am in one of those periods where I know clearly that something needs to change but do not yet know what the change should be or what it should change into. This kind of uncertainty is difficult to sit with but I have learned from previous experiences of it that trying to resolve it prematurely, by committing to the first plausible option that appears, usually leads somewhere that requires undoing. The discomfort of not knowing is preferable to the longer discomfort of having decided wrongly.',
    vi_full: 'Tôi đang trong một trong những giai đoạn mà tôi biết rõ rằng điều gì đó cần thay đổi nhưng chưa biết sự thay đổi đó nên là gì hay thay đổi thành gì. Sự không chắc chắn này khó mà ngồi yên với nó, nhưng từ những trải nghiệm trước tôi đã học được rằng cố giải quyết nó quá sớm, bằng cách cam kết với lựa chọn hợp lý đầu tiên xuất hiện, thường dẫn đến nơi phải tháo gỡ lại. Sự khó chịu của việc không biết vẫn tốt hơn sự khó chịu dài hơn của việc đã quyết định sai.',
  },
  {
    vi: 'Tôi thấy mình hài lòng với cuộc sống hiện tại hơn trước kia, không phải vì mọi thứ đều hoàn hảo mà vì tôi đã học cách chấp nhận tốt hơn.',
    en: 'I am more contented with my life than I have been in several years, and I have been trying to understand what accounts for the difference since the external circumstances are not dramatically better. What I keep arriving at is that I have become somewhat better at accepting what is rather than pushing against it, not a passive resignation but a genuine understanding that most of what I cannot control is not worth the energy that resistance costs. This has created space for other things.',
    vi_full: 'Tôi hài lòng với cuộc sống hơn những năm gần đây, và tôi đã cố gắng hiểu điều gì tạo ra sự khác biệt vì hoàn cảnh bên ngoài không tốt hơn đáng kể. Điều tôi liên tục nhận ra là tôi đã trở nên tốt hơn một chút trong việc chấp nhận những gì đang là thay vì chống lại nó, không phải từ bỏ thụ động mà là hiểu thực sự rằng hầu hết những gì tôi không kiểm soát được không đáng với năng lượng mà sự kháng cự tốn kém. Điều này đã tạo ra không gian cho những thứ khác.',
  },
  {
    vi: 'Tôi gặp một khó khăn lớn trong công việc hôm nay và phản ứng đầu tiên của tôi cho thấy tôi đã trưởng thành hơn so với trước.',
    en: 'A significant problem came up at work today that required immediate attention and involved some uncomfortable conversations, and I noticed that my reaction to it was different from how I would have handled a similar situation a few years ago. I was calmer, more organized in my thinking, quicker to identify what actually needed to happen rather than what I was feeling about it, and more effective as a result. Professional competence is partly technical knowledge and partly emotional regulation, and both take time to develop.',
    vi_full: 'Hôm nay có một vấn đề nghiêm trọng trong công việc đòi hỏi sự chú ý ngay lập tức và liên quan đến một số cuộc trò chuyện khó chịu, và tôi nhận thấy phản ứng của mình khác với cách tôi xử lý tình huống tương tự vài năm trước. Tôi bình tĩnh hơn, suy nghĩ có tổ chức hơn, nhanh hơn trong việc xác định điều thực sự cần xảy ra thay vì cảm nhận về nó, và vì vậy hiệu quả hơn. Năng lực chuyên nghiệp một phần là kiến thức kỹ thuật và một phần là điều tiết cảm xúc, và cả hai đều cần thời gian để phát triển.',
  },
  {
    vi: 'Tôi nghĩ về ý nghĩa của tình bạn và nhận ra rằng những người bạn tốt nhất của mình đều là những người không phán xét tôi.',
    en: 'I have been thinking about what makes the friendships I value most different from the ones I maintain more out of habit or proximity. The clearest distinguishing feature I can identify is the feeling of not being judged, the ability to say something unpolished or uncertain or unflattering about myself without worrying about what it will cost. This kind of unconditional regard is rarer than we pretend and more valuable than we acknowledge, and the people who provide it deserve more explicit gratitude than I usually remember to give.',
    vi_full: 'Tôi đã suy nghĩ về điều gì tạo ra sự khác biệt giữa những tình bạn tôi trân trọng nhất và những tình bạn tôi duy trì vì thói quen hay sự gần gũi. Đặc điểm phân biệt rõ ràng nhất tôi có thể nhận ra là cảm giác không bị phán xét, khả năng nói điều gì đó thô ráp, không chắc chắn hay không tâng bốc về bản thân mà không lo sợ hậu quả. Loại tình cảm vô điều kiện này hiếm hơn chúng ta giả vờ và có giá trị hơn chúng ta thừa nhận, và những người mang lại điều đó xứng đáng được biết ơn rõ ràng hơn tôi thường nhớ để bày tỏ.',
  },
  {
    vi: 'Tôi thực hiện một hành động tử tế nhỏ và hoàn toàn ẩn danh hôm nay và cảm giác đó thật nhẹ nhàng và sạch sẽ.',
    en: 'I did something kind for someone today without any possibility of them knowing it was me, and the feeling that produced was noticeably different from kindness that is visible and acknowledged. There was nothing complicated about it, no expectation of reciprocation, no social calculation involved, just the clean and simple sensation of having made something slightly better for someone else. I have decided to do this more often and to make it a practice rather than an occasional impulse.',
    vi_full: 'Hôm nay tôi làm điều tử tế cho ai đó mà không có khả năng họ biết đó là tôi, và cảm giác đó tạo ra rõ ràng khác với sự tử tế được nhìn thấy và được thừa nhận. Không có gì phức tạp về điều đó, không có kỳ vọng đáp lại, không có tính toán xã hội nào liên quan, chỉ là cảm giác sạch sẽ và đơn giản khi đã làm cho điều gì đó tốt hơn một chút cho người khác. Tôi đã quyết định làm điều này thường xuyên hơn và biến nó thành thói quen thay vì chỉ là một sự thôi thúc nhất thời.',
  },
  {
    vi: 'Tôi viết ra tất cả những điều mình lo lắng vào một tờ giấy, rồi nhận ra hầu hết chúng đều là những điều tôi không kiểm soát được.',
    en: 'I wrote down everything I am currently worried about on a single sheet of paper and then spent some time categorizing each item according to whether I have any meaningful control over it. The result was that roughly three-quarters of the items on the list fell into the category of things I cannot do anything practical about, which I already knew intellectually but seeing it laid out so clearly was useful. I put the paper away and tried to redirect attention only toward the things remaining in the other column.',
    vi_full: 'Tôi viết ra tất cả những điều tôi đang lo lắng hiện tại lên một tờ giấy rồi dành thời gian phân loại từng mục theo việc tôi có kiểm soát có ý nghĩa nào đó đối với nó không. Kết quả là khoảng ba phần tư các mục trong danh sách rơi vào danh mục những thứ tôi không thể làm gì thực tế, điều tôi đã biết về mặt lý trí nhưng nhìn thấy nó trình bày rõ ràng như vậy thì hữu ích. Tôi cất tờ giấy đi và cố gắng chuyển hướng sự chú ý chỉ về những thứ còn lại ở cột kia.',
  },
  {
    vi: 'Tôi thử sống chậm lại trong một tuần, làm ít hơn, quan sát nhiều hơn, và thấy rằng cuộc sống thực ra không cần phải nhanh như mình hay nghĩ.',
    en: 'I have been deliberately slowing down this week, doing fewer things and spending more time on each of them, and the experience has been both pleasant and revealing. I accomplish what needs to be done, the meals take a little longer and taste a little better, the conversations are less rushed and go further, and at the end of the day I feel less depleted than usual. I am not sure why I maintain a pace that costs this much when the alternative is clearly available, and I intend to think about that.',
    vi_full: 'Tôi đã cố ý chậm lại trong tuần này, làm ít việc hơn và dành nhiều thời gian hơn cho từng việc, và trải nghiệm này vừa dễ chịu vừa tiết lộ nhiều điều. Tôi hoàn thành những gì cần làm, bữa ăn mất thêm chút thời gian và ngon hơn một chút, những cuộc trò chuyện bớt vội vàng và đi sâu hơn, và cuối ngày tôi cảm thấy ít kiệt sức hơn bình thường. Tôi không chắc tại sao mình duy trì nhịp điệu tốn kém đến vậy khi lựa chọn thay thế rõ ràng là có sẵn, và tôi dự định suy nghĩ về điều đó.',
  },
];


function buildExamplePool(allWords) {
  const pool = [];
  for (const w of allWords) {
    if (!w.examples) continue;
    for (const ex of w.examples) {
      if (ex.en && ex.vi && ex.en.trim().length > 15) {
        pool.push({ word: w.word, en: ex.en.trim(), vi: ex.vi.trim(), level: w.level });
      }
    }
  }
  return pool;
}

function getPool() {
  return sentenceMode === 'diary' ? DIARY_SENTENCES : allExamples;
}

function pickRandom(excludeEn) {
  const pool = getPool();
  if (pool.length === 0) return null;
  const filtered = excludeEn && pool.length > 1 ? pool.filter(e => e.en !== excludeEn) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function renderWriteSentence(allWords) {
  if (allExamples.length === 0) {
    allExamples = buildExamplePool(allWords);
  }
  if (!currentExample) {
    currentExample = pickRandom(null);
  }

  const stats = store.getSentenceWritingStats();

  if (!currentExample) {
    return `
      <div class="flex items-center justify-center min-h-[60vh]">
        <p class="text-surface-400">Không có câu ví dụ nào để luyện tập.</p>
      </div>`;
  }

  const isDiary = sentenceMode === 'diary';

  return `
    <div class="max-w-2xl mx-auto px-4 pt-10 pb-10">
      <div class="fade-in mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-surface-100">Viết câu</h2>
          <p class="text-sm text-surface-400">Luyện viết lại câu từ gợi ý tiếng Việt</p>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/5">
          <svg class="w-4 h-4 text-success-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-lg font-bold text-success-400">${stats.total.toLocaleString()}</span>
          <span class="text-xs text-surface-400">câu thành công</span>
        </div>
      </div>

      <!-- Mode Toggle -->
      <div class="flex p-1 glass rounded-2xl border border-white/5 mb-4 fade-in" style="animation-delay: 0.05s">
        <button data-mode="vocab"
          class="flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all
                 ${!isDiary ? 'bg-primary-600/25 text-primary-400 shadow-sm' : 'text-surface-400 hover:text-surface-200'}">
          <span class="flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            Câu từ từ vựng
          </span>
        </button>
        <button data-mode="diary"
          class="flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all
                 ${isDiary ? 'bg-accent-600/25 text-accent-400 shadow-sm' : 'text-surface-400 hover:text-surface-200'}">
          <span class="flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Tâm sự cuộc sống
          </span>
        </button>
      </div>

      <div class="glass rounded-2xl p-6 fade-in" style="animation-delay: 0.1s">
        <!-- Badge row -->
        <div class="flex items-center gap-2 mb-4">
          ${isDiary
            ? `<span class="text-[10px] px-2 py-1 rounded-full bg-accent-600/20 text-accent-400 font-bold">Nhật ký</span>
               <span class="text-sm text-surface-400">Đoạn văn tâm sự cuộc sống</span>`
            : `<span class="text-[10px] px-2 py-1 rounded-full level-${currentExample.level.toLowerCase()} text-white font-bold">${currentExample.level}</span>
               <span class="text-sm text-surface-400">Từ khóa: <button id="write-keyword-btn" class="text-primary-400 font-semibold hover:text-primary-300 hover:underline underline-offset-2 transition-colors">${currentExample.word}</button></span>`}
        </div>

        <!-- Vietnamese prompt -->
        <div class="bg-white/5 rounded-xl p-4 mb-3">
          <p class="text-xs text-surface-500 mb-1.5">${isDiary ? 'Nội dung tiếng Việt:' : 'Nghĩa tiếng Việt:'}</p>
          <p class="text-surface-100 font-medium ${isDiary ? 'text-sm' : 'text-base'} leading-relaxed">
            ${currentExample.vi}
          </p>
        </div>

        <!-- Full Vietnamese translation collapsible -->
        ${isDiary && currentExample.vi_full ? `
        <div class="mb-4">
          <button id="toggle-full-vi"
            class="flex items-center gap-1.5 text-xs text-surface-500 hover:text-accent-400 transition-colors select-none">
            <svg id="full-vi-chevron" class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            <span id="full-vi-label">Xem bản dịch đầy đủ</span>
          </button>
          <div id="full-vi-content" class="hidden mt-2 bg-accent-500/5 border border-accent-500/15 rounded-xl p-4">
            <p class="text-sm text-surface-300 leading-relaxed">${currentExample.vi_full}</p>
          </div>
        </div>
        ` : ''}

        <!-- Top row: label + TTS -->
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-surface-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Gõ lại câu tiếng Anh
          </p>
          <button id="write-speak" title="Nghe phát âm"
            class="flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-400
                   bg-white/5 hover:bg-primary-500/10 border border-white/5 hover:border-primary-500/30
                   px-3 py-1.5 rounded-lg transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/>
            </svg>
            Nghe
          </button>
        </div>

        <!-- Char-by-char feedback target -->
        <div id="write-typing-target"
             class="font-mono ${isDiary ? 'text-sm tracking-normal' : 'text-lg tracking-wider'} mb-3 min-h-[1.75rem] break-words leading-relaxed"></div>

        <!-- Input: textarea for diary (long), input for vocab -->
        ${isDiary
          ? `<textarea id="write-input" autocomplete="off" spellcheck="false" rows="3"
               placeholder="Gõ đoạn văn tiếng Anh vào đây..."
               class="w-full bg-surface-800 border-2 border-surface-700 rounded-xl px-4 py-3
                      text-surface-100 placeholder-surface-600 focus:border-accent-500
                      outline-none transition-all text-sm mb-3 resize-none leading-relaxed"></textarea>`
          : `<input id="write-input" type="text" autocomplete="off" spellcheck="false"
               placeholder="Gõ câu tiếng Anh vào đây..."
               class="w-full bg-surface-800 border-2 border-surface-700 rounded-xl px-4 py-3
                      text-surface-100 placeholder-surface-600 focus:border-primary-500
                      outline-none transition-all text-base mb-3"/>`}

        <!-- Feedback banner -->
        <div id="write-feedback"
             class="hidden mb-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"></div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button id="write-check"
            class="flex-1 ${isDiary ? 'bg-accent-600 hover:bg-accent-500 shadow-accent-600/20' : 'bg-primary-600 hover:bg-primary-500 shadow-primary-600/20'} text-white font-bold py-2.5
                   rounded-xl transition-all shadow-lg">
            Kiểm tra
          </button>
          <button id="write-new"
            class="px-5 bg-white/5 hover:bg-white/10 text-surface-300 font-medium py-2.5
                   rounded-xl border border-white/5 transition-all">
            Câu mới
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initWriteSentenceEvents(allWords, rerenderFn) {
  if (allExamples.length === 0) {
    allExamples = buildExamplePool(allWords);
  }

  const input = document.getElementById('write-input');
  const feedbackEl = document.getElementById('write-feedback');
  const targetEl = document.getElementById('write-typing-target');

  function renderTypingTarget() {
    if (!targetEl || !input || !currentExample) return;
    const target = currentExample.en;
    const typed = input.value;
    targetEl.innerHTML = target.split('').map((ch, i) => {
      const esc = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
      if (i >= typed.length) return `<span class="text-surface-600">${esc}</span>`;
      return typed[i].toLowerCase() === ch.toLowerCase()
        ? `<span class="text-success-400">${esc}</span>`
        : `<span class="text-red-400">${esc}</span>`;
    }).join('');
  }

  function showFeedback(correct) {
    if (!feedbackEl) return;
    feedbackEl.className = `mb-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2
      ${correct
        ? 'bg-success-500/15 text-success-400 border border-success-500/25'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'}`;
    feedbackEl.innerHTML = correct
      ? `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg> Xuất sắc! Bạn đã viết đúng đoạn này rồi!`
      : `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg> Chưa đúng, hãy thử lại!`;
  }

  function loadNewSentence() {
    const prev = currentExample?.en || null;
    currentExample = pickRandom(prev);
    rerenderFn();
    setTimeout(() => { document.getElementById('write-input')?.focus(); }, 0);
  }

  function checkAnswer() {
    if (!input || !currentExample || input.disabled) return;
    const typed = input.value.trim();
    const correct = typed.toLowerCase() === currentExample.en.toLowerCase();
    showFeedback(correct);
    if (correct) {
      playDing();
      store.logSentenceWritten();
      input.disabled = true;
      setTimeout(loadNewSentence, 1200);
    }
  }

  // Mode toggle
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newMode = btn.dataset.mode;
      if (newMode === sentenceMode) return;
      sentenceMode = newMode;
      currentExample = pickRandom(null);
      rerenderFn();
      setTimeout(() => { document.getElementById('write-input')?.focus(); }, 0);
    });
  });

  // Init typing target
  renderTypingTarget();

  input?.addEventListener('input', renderTypingTarget);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
  });
  document.getElementById('write-check')?.addEventListener('click', checkAnswer);
  document.getElementById('write-new')?.addEventListener('click', loadNewSentence);

  document.getElementById('toggle-full-vi')?.addEventListener('click', () => {
    const content = document.getElementById('full-vi-content');
    const label = document.getElementById('full-vi-label');
    const chevron = document.getElementById('full-vi-chevron');
    if (!content) return;
    const isHidden = content.classList.toggle('hidden');
    if (chevron) chevron.style.transform = isHidden ? '' : 'rotate(180deg)';
    if (label) label.textContent = isHidden ? 'Xem bản dịch đầy đủ' : 'Ẩn bản dịch';
  });

  document.getElementById('write-keyword-btn')?.addEventListener('click', () => {
    const wordData = allWords.find(w => w.word === currentExample?.word);
    if (!wordData) return;
    document.getElementById('word-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', renderWordModal(wordData));
    initWordModalEvents(wordData);
  });

  document.getElementById('write-speak')?.addEventListener('click', () => {
    if (!window.speechSynthesis || !currentExample) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(currentExample.en);
    utt.lang = 'en-US';
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  });

  input?.focus();
}
