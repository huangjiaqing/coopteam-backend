import mongoose from 'mongoose';
import R from 'ramda';
const Stage = mongoose.model('Stage');

export default {
  /**
   * 获取某个项目下的所有阶段
   * @param {string} _projectId 
   */
  async getStages(_projectId) {
    const stages = await Stage.find({ _projectId });
    return (
      R.sort((a, b)=>(a.order-b.order))(stages)
    );
  },
  
  /**
   * 创建阶段
   * @param {object} data 
   */
  async createStage(data) {
    const { order=null } = data;
    let stages = await Stage.find({
       _projectId: data._projectId
    });
    let stage = {
      ...data,
      _stageId: mongoose.Types.ObjectId()
    };
    if (!order) {
      let stageCount = stages.length;
      stage.order = stageCount+1;
    }
    if (order && R.is(Number, order)) {
      stages.forEach(async (item) => {
        if (R.gte(item.order, order)) {
          let newOrder = item.order+1;
          await Stage.findOneAndUpdate({
            _stageId: item._stageId
          }, {
            order: newOrder
          });
        }
      });
    } else {
      return {
        message: '创建阶段失败'
      }
    }

    return await new Stage(stage).save();
  },

  /**
   * 移动阶段
   * @param {object} data 
   */
  async moveStage(data) {
    const { order, _projectId, _stageId } = data;
    const stages = await Stage.find({ _projectId });
    R.compose(
      // 编号
      R.addIndex(R.forEach)(async (stage, idx) => {
        await Stage.findOneAndUpdate({
          _stageId: stage._stageId,
        }, { order: idx + 1 });
      }),
      // 重组
      (stages) => {
        let isSame = (stage) => (
          R.equals(stage._stageId.toString(), _stageId)
        );
        let others = R.reject(isSame)(stages);
        let seleted = R.filter(isSame)(stages).pop();
        let _stages = R.insert(order-1, seleted)(others);
        return _stages;
      },
      // 排序
      R.sort((a, b) => (a.order - b.order))
    )(stages)
  }
};