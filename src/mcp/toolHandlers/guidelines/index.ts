import { toolRegistry } from '../../toolRegistry'
import { handleGuidelinesAnalysis } from './guidelinesAnalysis'
import { handleGuidelinesSave } from './guidelinesSave'

// Auto-registration des handlers guidelines
toolRegistry.register('guidelines_analysis', handleGuidelinesAnalysis)
toolRegistry.register('guidelines_save', handleGuidelinesSave)

// Export pour usage externe si nécessaire
export { handleGuidelinesAnalysis, handleGuidelinesSave }
