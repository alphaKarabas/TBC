import {CommandNodeType} from "./Modules/command";
import {LogerNodeType} from "./Modules/loger";
import {TextNodeType} from "./Modules/text";
import {TextMassageNodeType} from "./Modules/textMassage";
import {QuestionNodeType} from "./Modules/question";
import nodeTypeWraper from "./nodeTypeWraper";

export default {
    'command': nodeTypeWraper(CommandNodeType),
    'loger': nodeTypeWraper(LogerNodeType),
    'text': nodeTypeWraper(TextNodeType),
    'textMassage': nodeTypeWraper(TextMassageNodeType),
    'question': nodeTypeWraper(QuestionNodeType),
}