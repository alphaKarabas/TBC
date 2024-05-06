import {CommandNodeType} from "../modules/command";
import {LogerNodeType} from "../modules/loger";
import {TextNodeType} from "../modules/text";
import {TextMassageNodeType} from "../modules/textMassage";
import {QuestionNodeType} from "../modules/question";
import nodeTypeWraper from "../components/nodeTypeWraper";

export default {
    'command': nodeTypeWraper(CommandNodeType),
    'loger': nodeTypeWraper(LogerNodeType),
    'text': nodeTypeWraper(TextNodeType),
    'textMassage': nodeTypeWraper(TextMassageNodeType),
    'question': nodeTypeWraper(QuestionNodeType),
}