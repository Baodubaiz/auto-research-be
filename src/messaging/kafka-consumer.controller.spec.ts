import { jest } from '@jest/globals';
import { KafkaConsumerController } from './kafka-consumer.controller';
import { RequestCorrelationService } from './request-correlation.service';

describe('KafkaConsumerController', () => {
  let controller: KafkaConsumerController;
  let correlationService: RequestCorrelationService;

  beforeEach(() => {
    correlationService = new RequestCorrelationService();
    controller = new KafkaConsumerController(correlationService);
  });

  it('should process document_setup response and route correctly', async () => {
    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    await controller.handleDocumentSetupResponse({
      user_id: 'u-1',
      document_id: 'doc-1',
      session_id: 'sess-1',
      event_type: 'search_papers',
      data: [1, 2, 3],
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      'u-1:doc-1:sess-1:search_papers',
      expect.objectContaining({ event_type: 'search_papers' }),
    );
  });

  it('should process write_section response', async () => {
    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    await controller.handleWriteSectionResponse({
      user_id: 'u-1',
      document_id: 'doc-1',
      session_id: 'sess-1',
      event_type: 'write_content',
      section: 'intro',
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      'u-1:doc-1:sess-1:write_content',
      expect.objectContaining({ section: 'intro' }),
    );
  });

  it('should process chatbot response using conv_id', async () => {
    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    await controller.handleChatbotResponse({
      user_id: 'u-1',
      conv_id: 'conv-10',
      session_id: 'sess-1',
      event_type: 'outer_chatbot',
      response: 'Hello',
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      'u-1:conv-10:sess-1:outer_chatbot',
      expect.objectContaining({ response: 'Hello' }),
    );
  });

  it('should process enhancement response', async () => {
    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    await controller.handleEnhancementResponse({
      user_id: 'u-1',
      document_id: 'doc-1',
      session_id: 'sess-1',
      event_type: 'enhance',
      improved_text: 'Done',
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      'u-1:doc-1:sess-1:enhance',
      expect.objectContaining({ improved_text: 'Done' }),
    );
  });

  it('should parse JSON string payload', async () => {
    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    const jsonString = JSON.stringify({
      user_id: 'u-1',
      document_id: 'doc-1',
      session_id: 'sess-1',
      event_type: 'search_papers',
    });

    await controller.handleDocumentSetupResponse(jsonString);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore invalid non-object payload gracefully', async () => {
    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    await controller.handleDocumentSetupResponse(null);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should catch JSON parse errors without crashing', async () => {
    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    await controller.handleDocumentSetupResponse('{invalid-json');
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should call tokenUsageService.recordUsageFromPayload when present', async () => {
    const mockTokenUsageService = {
      recordUsageFromPayload: jest.fn().mockResolvedValue(undefined as never),
    };

    const controllerWithToken = new KafkaConsumerController(
      correlationService,
      undefined,
      mockTokenUsageService as any,
    );

    const payload = {
      user_id: 'u-1',
      document_id: 'doc-1',
      session_id: 'sess-1',
      event_type: 'search_papers',
      input_tokens: 50,
      output_tokens: 25,
    };

    await controllerWithToken.handleDocumentSetupResponse(payload);

    expect(mockTokenUsageService.recordUsageFromPayload).toHaveBeenCalledWith(
      payload,
    );
  });

  it('should gracefully handle error from tokenUsageService without breaking dispatch', async () => {
    const mockTokenUsageService = {
      recordUsageFromPayload: jest
        .fn()
        .mockRejectedValue(new Error('Token recording failed') as never),
    };

    const controllerWithToken = new KafkaConsumerController(
      correlationService,
      undefined,
      mockTokenUsageService as any,
    );

    const dispatchSpy = jest.spyOn(correlationService, 'dispatchResponse');

    const payload = {
      user_id: 'u-1',
      document_id: 'doc-1',
      session_id: 'sess-1',
      event_type: 'search_papers',
    };

    await controllerWithToken.handleDocumentSetupResponse(payload);

    expect(dispatchSpy).toHaveBeenCalled();
  });
});
